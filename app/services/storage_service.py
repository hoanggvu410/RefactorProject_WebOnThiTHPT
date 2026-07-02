from supabase import create_client

from config import get_settings


def get_supabase_client():
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

def upload_public_file(bucket: str, object_path:str, contents: bytes, content_type: str) -> str:
    supabase = get_supabase_client()

    supabase.storage.from_(bucket).upload(object_path, contents, file_options={"content-type": content_type, "upsert":"false"})

    public_url = supabase.storage.from_(bucket).get_public_url(object_path)
    return public_url