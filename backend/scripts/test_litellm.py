"""
Quick sanity check that the Anthropic SDK can talk to the LiteLLM proxy.

Reads OCTANE_LITELLM and OCTANE_API_KEY from the backend's .env
(or the shell environment). Run from the backend/ directory:

    python scripts/test_litellm.py [model-name]
"""
import os
import sys

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Drop ANTHROPIC_API_KEY so the SDK doesn't also send x-api-key alongside the
# bearer token — LiteLLM expects Authorization: Bearer only.
os.environ.pop("ANTHROPIC_API_KEY", None)


def main() -> int:
    base_url = os.environ.get("OCTANE_LITELLM")
    auth_token = os.environ.get("OCTANE_API_KEY")

    if not base_url or not auth_token:
        print("ERROR: set OCTANE_LITELLM and OCTANE_API_KEY", file=sys.stderr)
        return 1

    model = sys.argv[1] if len(sys.argv) > 1 else "claude-haiku-4-5"

    print(f"base_url = {base_url}")
    print(f"model    = {model}")
    print("sending: ping")

    client = Anthropic(base_url=base_url, auth_token=auth_token)

    msg = client.messages.create(
        model=model,
        max_tokens=128,
        temperature=0.7,
        messages=[{"role": "user", "content": "ping"}],
    )

    text = msg.content[0].text if msg.content else "<empty>"
    print(f"reply    = {text}")
    print(f"usage    = in={msg.usage.input_tokens} out={msg.usage.output_tokens}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
