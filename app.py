from kivymd.app import MDApp
from kivy.lang import Builder
from plyer import filechooser
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.dropdown import DropDown
from kivy.uix.button import Button
# from datasets import load_dataset
import os
import json
import codecs
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
from transformers import pipeline

Builder.load_file('sedato.kv')


class Main(MDApp):
    def build(self):
        self.icon = 'images/icon.ico'
        self.title = 'Sedato'
        self.theme_cls.primary_palette = "DeepOrange"
        self.theme_cls.primary_hue = "500"

        screen_manager = ScreenManager()

        # Create instances of the screens
        sedato = Sedato(name='sedato')
        text2audio = Text2Audio(name='text2audio')
        audio2text = Audio2Text(name='audio2text')
        audio2text_progress = Audio2TextProgress(name='audio2text_progress')

        # Add screens to the screen manager
        screen_manager.add_widget(sedato)
        screen_manager.add_widget(text2audio)
        screen_manager.add_widget(audio2text)
        screen_manager.add_widget(audio2text_progress)

        return screen_manager


class Sedato(Screen):
    def __init__(self, **kwargs):
        super(Sedato, self).__init__(**kwargs)

    def goTo(self, page):
        self.manager.transition.direction = 'left'
        self.manager.current = page


class Text2Audio(Screen):
    def __init__(self, **kwargs):
        super(Text2Audio, self).__init__(**kwargs)

    def back(self):
        self.manager.transition.direction = 'right'
        self.manager.current = 'sedato'


class Audio2Text(Screen):
    def __init__(self, **kwargs):
        super(Audio2Text, self).__init__(**kwargs)

    def select_file(self):
        path = filechooser.open_file(title="Audio/Video", filters=[
                                     ("MediaFile", "*.mp3",
                                      "*.mp4", "*.wav", "*.flac")])
        print(self.manager.screens[3].start(
            model=self.ids.audio2text_model_button.text,
            path=path[0]))

        self.manager.screens[3].start(
            self.ids.audio2text_model_button.text,
            path[0]
        )

        self.manager.transition.direction = 'left'
        self.manager.current = 'audio2text_progress'

    def select_model(self):
        models = [
            'openai/whisper-large-v3',
            'openai/whisper-large-v2',
            'openai/whisper-large',
            'openai/whisper-medium',
            'openai/whisper-small',
        ]
        dropdown = DropDown()
        for x in models:
            btn = Button(text=x, size_hint_y=None, height=27,
                         background_color=(0.1, 0.1, 0.1, 1),
                         halign='center', padding=(10, 8), markup=True)
            btn.bind(on_release=lambda btn: dropdown.select(btn.text))
            dropdown.add_widget(btn)
        dropdown.bind(on_select=lambda instance,
                      x: setattr(self.ids.audio2text_model_button, 'text', x))
        dropdown.open(self.ids.audio2text_model_button)

    def back(self):
        self.manager.transition.direction = 'right'
        self.manager.current = 'sedato'


class Audio2TextProgress(Screen):
    def __init__(self, **kwargs):
        super(Audio2TextProgress, self).__init__(**kwargs)

    def convert(self, model, path):
        if (path.lower().endswith(('.mp4'))):
            import moviepy.editor as mp
            audio = os.path.join(os.getcwd() + '/output/' +
                                 os.path.basename(path) + ".mp3")
            if (os.path.exists(audio)):
                self.convert(model, audio)
                return

            clip = mp.VideoFileClip(path)
            clip.audio.write_audiofile(audio)
            self.convert(model, audio)
            return

        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        model_id = "openai/whisper-large-v3"

        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            model_id, torch_dtype=dtype, low_cpu_mem_usage=True,
            use_safetensors=True
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
            torch_dtype=dtype,
            device=device,
        )

        json_output = os.getcwd() + '/output/' \
            + os.path.basename(path) + ".json"

        result = pipe(path)
        self.save_json(os.path.join(json_output), result)

        srt = ""
        from datetime import datetime, timedelta

        def get_time(x):
            time_delta = timedelta(seconds=x)
            midnight = datetime.combine(datetime.today(), datetime.min.time())
            r = midnight + time_delta
            i = r.strftime('%H:%M:%S.%f')[:-3]
            return i

        for i, x in enumerate(result['chunks']):
            srt += (str(i)+"\n")
            srt += (get_time(x['timestamp'][0]) + " --> "
                    + get_time(x['timestamp'][1]) + "\n")
            srt += (x['text']+"\n")
            srt += "\n"

        srt_output = os.getcwd() + '/output/' \
            + os.path.basename(path) + ".srt"

        self.save_string(srt_output, srt)
        return

    def start(self, model, path):
        from threading import Thread

        self.ids.file_name.text = "File: " + os.path.basename(path)
        self.ids.model_name.text = "By: " + model
        self.ids.progress.value = 0

        thread = Thread(target=self.convert, args=(model, path))
        thread.start()
        # self.convert(model, path)

    def back(self):
        self.manager.transition.direction = 'right'
        self.manager.current = 'audio2text'

    def save_string(self, path, data):
        f = codecs.open(path, "w+", encoding="utf-8")
        f.truncate(0)
        f.write(data)
        f.close()

    def save_json(self, path, data):
        self.save_string(path, json.dumps(data, ensure_ascii=False))

    def get_string(self, path):
        f = codecs.open(path, "r", "utf-8")
        return f.read()

    def get_json(self, path):
        return json.loads(self.get_string(path))


if __name__ == '__main__':
    Main().run()
