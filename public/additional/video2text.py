from argparse import ArgumentParser
import os

parser = ArgumentParser()
parser.add_argument("-i", "--install", dest="install", default=False,
                    action="store_true",  help="Install requirements")

parser.add_argument("-c", "--check", dest="check", default=False,
                    action="store_true",  help="Check Installation")

args = parser.parse_args()


def check():
    try:
        import torch
        import transformers
        import datasets
        print("installed")
    except ModuleNotFoundError:
        print("not installed")


def install():
    try:
        import torch
        import transformers
        import datasets
        print("modules are already installed.")
    except ModuleNotFoundError:
        os.system('')


if args.install:
    install()
elif args.check:
    check()
