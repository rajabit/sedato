from kivy.app import App
from kivy.lang import Builder
from plyer import filechooser
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.dropdown import DropDown
from kivy.uix.button import Button


Builder.load_file('sedato.kv')


class Main(App):
    def build(self):
        self.icon = 'images/icon.ico'
        self.title = 'Sedato'
        screen_manager = ScreenManager()

        # Create instances of the screens
        sedato = Sedato(name='sedato')
        text2audio = Text2Audio(name='text2audio')
        audio2text = Audio2Text(name='audio2text')

        # Add screens to the screen manager
        screen_manager.add_widget(sedato)
        screen_manager.add_widget(text2audio)
        screen_manager.add_widget(audio2text)

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
        path = filechooser.open_file(title="Pick a CSV file..", filters=[
                                     ("MediaFile", "*.mp3")])

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


if __name__ == '__main__':
    Main().run()
