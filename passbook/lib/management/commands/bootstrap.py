"""passbook management command to bootstrap"""
from sys import exit as _exit
from time import sleep

from django.core.management.base import BaseCommand
from django.db import connection
from django.db.utils import OperationalError
from django_redis import get_redis_connection
from redis.exceptions import ConnectionError as RedisConnectionError
from structlog import get_logger

LOGGER = get_logger()


class Command(BaseCommand):
    """Bootstrap passbook, ensure Database and Cache are
    reachable, and directories are writeable"""

    help = """Bootstrap passbook, ensure Database and Cache are
    reachable, and directories are writeable"""

    def check_database(self) -> bool:
        """Return true if database is reachable, false otherwise"""
        try:
            connection.cursor()
            LOGGER.info("Database reachable")
            return True
        except OperationalError:
            LOGGER.info("Database unreachable")
            return False

    def check_cache(self) -> bool:
        """Return true if cache is reachable, false otherwise"""
        try:
            con = get_redis_connection("default")
            con.ping()
            LOGGER.info("Cache reachable")
            return True
        except RedisConnectionError:
            LOGGER.info("Cache unreachable")
            return False

    def handle(self, *args, **options):
        LOGGER.info("passbook bootstrapping...")
        should_check = True
        while should_check:
            should_check = not (self.check_database() and self.check_cache())
            sleep(1)
        LOGGER.info("Dependencies are up, exiting...")
        _exit(0)
