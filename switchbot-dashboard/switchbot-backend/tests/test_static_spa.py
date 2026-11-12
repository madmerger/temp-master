from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import register_spa_routes


def test_static_spa_routes_serve_assets_and_fallback(tmp_path):
    (tmp_path / "index.html").write_text("<div id=root>")
    assets_dir = tmp_path / "assets"
    assets_dir.mkdir()
    (assets_dir / "app.js").write_text("console.log('app')")

    app = FastAPI()
    register_spa_routes(app, tmp_path)
    client = TestClient(app)

    for path, content in [
        ("/", "<div id=root>"),
        ("/assets/app.js", "console.log('app')"),
    ]:
        get_response = client.get(path)
        assert get_response.status_code == 200
        assert get_response.text == content

        head_response = client.head(path)
        assert head_response.status_code == 200
        assert head_response.content == b""

    fallback_response = client.get("/meters/abc")
    assert fallback_response.status_code == 200
    assert fallback_response.text == "<div id=root>"

    traversal_response = client.get("/..%2f..%2fetc%2fpasswd")
    assert traversal_response.status_code == 200
    assert traversal_response.text == "<div id=root>"
