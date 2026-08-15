"""Quick API test for all PDF Tool endpoints."""
import requests

BASE = "http://localhost:8000"

def test_all():
    # Test root
    r = requests.get(f"{BASE}/")
    assert r.status_code == 200
    print(f"[OK] Root: {r.json()['status']}")

    # Test health
    r = requests.get(f"{BASE}/api/health")
    assert r.status_code == 200
    print(f"[OK] Health: {r.json()['status']}")

    # Test PDF Info
    with open("test1.pdf", "rb") as f:
        r = requests.post(f"{BASE}/api/pdf/info", files={"file": ("test1.pdf", f, "application/pdf")})
    assert r.status_code == 200
    info = r.json()
    print(f"[OK] PDF Info: {info['page_count']} pages, {info['file_size']} bytes")

    # Test Merge
    with open("test1.pdf", "rb") as f1, open("test2.pdf", "rb") as f2:
        r = requests.post(f"{BASE}/api/pdf/merge", files=[
            ("files", ("test1.pdf", f1, "application/pdf")),
            ("files", ("test2.pdf", f2, "application/pdf")),
        ])
    assert r.status_code == 200
    print(f"[OK] Merge: {r.json()['size']} bytes")

    # Test Compress
    with open("test1.pdf", "rb") as f:
        r = requests.post(f"{BASE}/api/pdf/compress",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"quality": "medium"})
    assert r.status_code == 200
    d = r.json()
    print(f"[OK] Compress: {d['original_size']} -> {d['compressed_size']} ({d['reduction_percent']}% reduction)")

    # Test Rotate
    with open("test1.pdf", "rb") as f:
        r = requests.post(f"{BASE}/api/pdf/rotate",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"pages": "[1]", "angle": "90"})
    assert r.status_code == 200
    print(f"[OK] Rotate: file_id={r.json()['file_id'][:8]}...")

    # Test Watermark
    with open("test1.pdf", "rb") as f:
        r = requests.post(f"{BASE}/api/pdf/watermark",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"text": "CONFIDENTIAL", "opacity": "0.3", "font_size": "50"})
    assert r.status_code == 200
    print(f"[OK] Watermark: file_id={r.json()['file_id'][:8]}...")

    # Test Page Numbers
    with open("test1.pdf", "rb") as f:
        r = requests.post(f"{BASE}/api/pdf/page-numbers",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"position": "bottom-center"})
    assert r.status_code == 200
    print(f"[OK] Page Numbers: file_id={r.json()['file_id'][:8]}...")

    # Test Thumbnails
    with open("test1.pdf", "rb") as f:
        r = requests.post(f"{BASE}/api/pdf/thumbnails",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"width": "200"})
    assert r.status_code == 200
    td = r.json()
    print(f"[OK] Thumbnails: {td['page_count']} pages, {len(td['thumbnails'])} thumbnails")

    # Test PDF to Image
    with open("test1.pdf", "rb") as f:
        r = requests.post(f"{BASE}/api/convert/pdf-to-image",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"format": "jpg", "dpi": "150"})
    assert r.status_code == 200
    cd = r.json()
    print(f"[OK] PDF->Image: type={cd['type']}, file_id={cd['file_id'][:8]}...")

    # Test Download
    file_id = cd["file_id"]
    r = requests.get(f"{BASE}/api/files/download/{file_id}")
    assert r.status_code == 200
    print(f"[OK] Download: {len(r.content)} bytes, content-type={r.headers.get('content-type')}")

    # Test File Stats
    r = requests.get(f"{BASE}/api/files/stats")
    assert r.status_code == 200
    print(f"[OK] File Stats: {r.json()['total_files']} files in temp")

    print()
    print("=" * 50)
    print("ALL API TESTS PASSED!")
    print("=" * 50)


if __name__ == "__main__":
    test_all()
