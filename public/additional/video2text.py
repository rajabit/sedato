from argparse import ArgumentParser
import os

parser = ArgumentParser()
parser.add_argument("-cuda", "--cuda-available", dest="cuda", default=False,
                    action="store_true",  help="Check cuda")

parser.add_argument("-cto", "--check-torch", dest="check_torch", default=False,
                    action="store_true",  help="Check torch Installation")

parser.add_argument("-ctr", "--check-transformers", dest="check_transformers", default=False,
                    action="store_true",  help="Check transformers Installation")


args = parser.parse_args()


def check_torch():
    try:
        import torch
        print("installed")
    except ModuleNotFoundError:
        print("not installed")
        
def check_transformers():
    try:
        import transformers
        import datasets
        print("installed")
    except ModuleNotFoundError:
        print("not installed")



def cuda():
    try:
        import torch
        if torch.cuda.is_available():
            print("available")
        else :
            print("unavailable")
    except ModuleNotFoundError:
        os.system('modules are not installed')


if args.cuda:
    cuda()
elif args.check_torch:
    check_torch()
elif args.check_transformers:
    check_transformers()
