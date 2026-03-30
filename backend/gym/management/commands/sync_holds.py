"""
Management command: sync_holds

Fetches train.jsonl from the HuggingFace climbing-holds dataset and upserts
HoldType records in the database.

Usage:
    python manage.py sync_holds
    python manage.py sync_holds --source /path/to/local/train.jsonl
    python manage.py sync_holds --branch v1
"""

import json
import urllib.request

from django.conf import settings
from django.core.management.base import BaseCommand

from gym.models import Gym, HoldInstance, HoldType

# train.jsonl is in the repo root of the HF dataset
TRAIN_JSONL_URL = "{base}/train.jsonl"

# Map HF "type" values to our model's USAGE_CHOICES
TYPE_MAP = {
    "hold": "hold",
    "volume": "volume",
    "jug": "hold",
    "crimp": "hold",
    "sloper": "hold",
    "pinch": "hold",
    "unknown": "unknown",
}


class Command(BaseCommand):
    help = "Sync HoldType records from the HuggingFace climbing-holds dataset (train.jsonl)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            default=None,
            help='Path to a local train.jsonl file (skips the HTTP fetch)',
        )
        parser.add_argument(
            '--branch',
            type=str,
            default=None,
            help='HF dataset branch to fetch from (overrides HOLDS_CDN_BASE)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print what would be changed without writing to the database',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        demo_gym = Gym.objects.filter(id=1).first()

        if options['source']:
            lines = self._read_local(options['source'])
        else:
            cdn_base = settings.HOLDS_CDN_BASE
            if options['branch']:
                # Replace whatever branch is in the URL with the requested one
                parts = cdn_base.rstrip('/').rsplit('/resolve/', 1)
                cdn_base = f"{parts[0]}/resolve/{options['branch']}"
            url = TRAIN_JSONL_URL.format(base=cdn_base)
            self.stdout.write(f"Fetching {url} …")
            lines = self._fetch_remote(url)

        created = updated = skipped = 0

        for line in lines:
            line = line.strip()
            if not line:
                continue

            entry = json.loads(line)
            cdn_ref = entry.get('hold_id', '').strip()
            if not cdn_ref:
                continue

            hold_type_value = TYPE_MAP.get(entry.get('type', 'unknown'), 'unknown')

            defaults = {
                'manufacturer': entry.get('manufacturer', 'unknown') or 'unknown',
                'model': entry.get('model', 'unknown') or 'unknown',
                'size': entry.get('size', 'unknown') or 'unknown',
                'hold_usage_type': hold_type_value,
                'available_colors': entry.get('available_colors') or [],
                'color_of_scan': entry.get('color_of_scan', '') or '',
            }

            if dry_run:
                self.stdout.write(f"  [dry-run] would upsert cdn_ref={cdn_ref} {defaults}")
                continue

            obj, was_created = HoldType.objects.update_or_create(
                cdn_ref=cdn_ref,
                defaults=defaults,
            )

            if was_created:
                created += 1
            else:
                updated += 1

            # Ensure every hold type is available in the demo gym
            if demo_gym:
                usage = 'volume' if hold_type_value == 'volume' else 'hold'
                HoldInstance.objects.get_or_create(
                    gym=demo_gym,
                    hold_type=obj,
                    defaults={
                        'name': f"{defaults['manufacturer']} — {defaults['model']}",
                        'usage_type': usage,
                    },
                )

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes written."))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Done — {created} created, {updated} updated, {skipped} skipped."
                )
            )

    def _fetch_remote(self, url: str) -> list[str]:
        req = urllib.request.Request(url, headers={"User-Agent": "setrsoft-sync/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read().decode('utf-8').splitlines()

    def _read_local(self, path: str) -> list[str]:
        self.stdout.write(f"Reading local file: {path}")
        with open(path, encoding='utf-8') as fh:
            return fh.readlines()
