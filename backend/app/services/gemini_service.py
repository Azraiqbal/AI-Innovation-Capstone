import time
import httpx

from google import genai
from google.genai.errors import ServerError

from app.core.config import GEMINI_API_KEY


client = genai.Client(api_key=GEMINI_API_KEY)


def generate_with_retry(prompt: str, max_retries: int = 3):
    last_error = None

    for attempt in range(max_retries):
        try:
            return client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

        except (ServerError, httpx.HTTPError) as error:
            last_error = error

            if attempt < max_retries - 1:
                wait_time = 2 * (attempt + 1)

                print(
                    f"Gemini temporary error. "
                    f"Retrying in {wait_time} seconds..."
                )

                time.sleep(wait_time)

    raise RuntimeError(
        "Gemini service is temporarily unavailable."
    ) from last_error