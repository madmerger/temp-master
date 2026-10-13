import json

import app.main as main


def make_dist(tmp_path):
    dist = tmp_path / "dist"
    assets = dist / "assets"
    assets.mkdir(parents=True)
    (dist / "index.html").write_text("<html><body>built app</body></html>")
    (assets / "app.js").write_text("console.log('built');")
    return dist


def test_root_serves_index_without_cache(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "STATIC_DIR", make_dist(tmp_path))

    response = client.get("/")

    assert response.status_code == 200
    assert response.text == "<html><body>built app</body></html>"
    assert response.headers["cache-control"] == "no-cache"


def test_client_route_falls_back_to_index(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "STATIC_DIR", make_dist(tmp_path))

    response = client.get("/some/client/route")

    assert response.status_code == 200
    assert response.text == "<html><body>built app</body></html>"
    assert response.headers["cache-control"] == "no-cache"


def test_assets_are_served_with_immutable_cache(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "STATIC_DIR", make_dist(tmp_path))

    response = client.get("/assets/app.js")

    assert response.status_code == 200
    assert response.text == "console.log('built');"
    assert response.headers["cache-control"] == "public, max-age=31536000, immutable"


def test_unknown_api_route_is_json_404(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "STATIC_DIR", make_dist(tmp_path))

    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}
    assert "text/html" not in response.headers["content-type"]


def test_path_traversal_does_not_serve_outside_file(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "STATIC_DIR", make_dist(tmp_path))

    response = client.get("/..%2F..%2Fetc/passwd")

    assert response.status_code == 200
    assert response.text == "<html><body>built app</body></html>"
    assert "root:" not in response.text


def test_missing_dist_returns_404(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "STATIC_DIR", tmp_path / "missing")

    response = client.get("/")

    assert response.status_code == 404


def test_existing_api_route_still_returns_json(client, monkeypatch, tmp_path):
    monkeypatch.setattr(main, "STATIC_DIR", make_dist(tmp_path))

    response = client.get("/api/meters")

    assert response.status_code == 200
    assert "application/json" in response.headers["content-type"]
    assert isinstance(response.json()["meters"], list)
