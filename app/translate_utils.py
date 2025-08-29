from google.cloud import translate_v2 as translate



def translate_text(text: str, target_lang: str) -> str:
    translator = translate.Client()
    try:
        translation = translator.translate(text, target_language=target_lang)
        return translation.text
    except Exception as e:
        print(f"Translation error: {e}")
        return text