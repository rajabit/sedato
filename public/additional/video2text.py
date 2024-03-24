import json
from argparse import ArgumentParser
import os

parser = ArgumentParser()
parser.add_argument("-cuda", "--cuda-available", dest="cuda", default=False,
                    action="store_true",  help="Check cuda")

parser.add_argument("-cto", "--check-torch", dest="check_torch", default=False,
                    action="store_true",  help="Check torch Installation")

parser.add_argument("-ctr", "--check-transformers", dest="check_transformers", default=False,
                    action="store_true",  help="Check transformers Installation")

parser.add_argument("-i", "--input", dest="input", default=None, required=False,
                    metavar="FILE", help="Source video / audio")

parser.add_argument("-o", "--output", dest="output", default=None, required=False,
                    metavar="FILE", help="Output text")

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
        else:
            print("unavailable")
    except ModuleNotFoundError:
        print("not installed")


def convert(input, out=None):
    if not os.path.isfile(input):
        print(input)
        print("File not exists")
        return

    import torch
    import json
    from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

    if input.endswith('.mp4'):
        import subprocess
        subprocess.run(["ffmpeg", "-i", input,
                       "-b:a", "192K", "-vn", input + ".mp3"])
        input = input + ".mp3"

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    model_id = "openai/whisper-large-v3"

    model = AutoModelForSpeechSeq2Seq.from_pretrained(
        model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
    )
    model.to(device)

    processor = AutoProcessor.from_pretrained(model_id)

    pipe = pipeline(
        "automatic-speech-recognition",
        model=model,
        tokenizer=processor.tokenizer,
        feature_extractor=processor.feature_extractor,
        max_new_tokens=128,
        chunk_length_s=30,
        batch_size=16,
        return_timestamps=True,
        torch_dtype=torch_dtype,
        device=device,
        generate_kwargs={"language": "english"}
    )

    result = pipe(input)

    if out is None:
        out = input + ".json"

    f = open(out, "w", encoding='utf-8')
    f.write(json.dumps(result, ensure_ascii=False, indent=2))
    f.close()


if args.cuda:
    cuda()
elif args.check_torch:
    check_torch()
elif args.check_transformers:
    check_transformers()
elif args.input is not None:
    convert(args.input, args.output)
