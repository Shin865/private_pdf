"""Integration test for all PDF Tool API endpoints."""
import requests
import json
import sys

base = "http://localhost:8000/api"
passed = 0
failed = 0

def test(name, func):
    global passed, failed
    try:
        func()
        passed += 1
        print(f"  PASS: {name}")
    except Exception as e:
        failed += 1
        print(f"  FAIL: {name} - {e}")

# Test 1: Health
def test_health():
    res = requests.get(f"{base}/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

# Test 2: PDF Info
def test_info():
    with open("test1.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/info", files={"file": ("test1.pdf", f, "application/pdf")})
    assert res.status_code == 200
    data = res.json()
    assert data["page_count"] == 1
    print(f"    Pages: {data['page_count']}, Size: {data['file_size']} bytes")

# Test 3: Merge
def test_merge():
    with open("test1.pdf", "rb") as f1, open("test2.pdf", "rb") as f2:
        res = requests.post(f"{base}/pdf/merge", files=[
            ("files", ("test1.pdf", f1, "application/pdf")),
            ("files", ("test2.pdf", f2, "application/pdf")),
        ])
    assert res.status_code == 200
    data = res.json()
    assert "file_id" in data
    print(f"    Merged: {data['size']} bytes")

# Test 4: Thumbnails
def test_thumbnails():
    with open("test2.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/thumbnails",
                          files={"file": ("test2.pdf", f, "application/pdf")},
                          data={"width": "200"})
    assert res.status_code == 200
    data = res.json()
    assert data["page_count"] == 2
    assert len(data["thumbnails"]) == 2
    print(f"    Thumbnails: {len(data['thumbnails'])} pages")

# Test 5: Split
def test_split():
    with open("test2.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/split",
                          files={"file": ("test2.pdf", f, "application/pdf")},
                          data={"ranges": "[[1,1],[2,2]]"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["files"]) == 2
    print(f"    Split into {len(data['files'])} files")

# Test 6: Extract
def test_extract():
    with open("test2.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/extract",
                          files={"file": ("test2.pdf", f, "application/pdf")},
                          data={"pages": "[1]"})
    assert res.status_code == 200
    data = res.json()
    assert "file_id" in data
    print(f"    Extracted: {data['size']} bytes")

# Test 7: Delete pages
def test_delete():
    with open("test2.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/delete-pages",
                          files={"file": ("test2.pdf", f, "application/pdf")},
                          data={"pages": "[2]"})
    assert res.status_code == 200
    data = res.json()
    assert "file_id" in data
    print(f"    After delete: {data['size']} bytes")

# Test 8: Reorder
def test_reorder():
    with open("test2.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/reorder",
                          files={"file": ("test2.pdf", f, "application/pdf")},
                          data={"order": "[2,1]"})
    assert res.status_code == 200
    data = res.json()
    assert "file_id" in data
    print(f"    Reordered: {data['size']} bytes")

# Test 9: Rotate
def test_rotate():
    with open("test2.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/rotate",
                          files={"file": ("test2.pdf", f, "application/pdf")},
                          data={"pages": "[1]", "angle": "90"})
    assert res.status_code == 200
    data = res.json()
    assert "file_id" in data
    print(f"    Rotated: {data['size']} bytes")

# Test 10: Compress
def test_compress():
    with open("test2.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/compress",
                          files={"file": ("test2.pdf", f, "application/pdf")},
                          data={"quality": "medium"})
    assert res.status_code == 200
    data = res.json()
    assert "file_id" in data
    print(f"    Original: {data['original_size']}B -> Compressed: {data['compressed_size']}B ({data['reduction_percent']}%)")

# Test 11: Watermark
def test_watermark():
    with open("test1.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/watermark",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"text": "CONFIDENTIAL", "opacity": "0.3", "font_size": "50", "rotation": "45", "position": "center"})
    assert res.status_code == 200
    data = res.json()
    assert "file_id" in data
    print(f"    Watermarked: {data['size']} bytes")

# Test 12: Page Numbers
def test_page_numbers():
    with open("test2.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/page-numbers",
                          files={"file": ("test2.pdf", f, "application/pdf")},
                          data={"position": "bottom-center", "format_str": "Page {current} of {total}"})
    assert res.status_code == 200
    data = res.json()
    assert "file_id" in data
    print(f"    Numbered: {data['size']} bytes")

# Test 13: PDF to Image
def test_pdf_to_image():
    with open("test1.pdf", "rb") as f:
        res = requests.post(f"{base}/convert/pdf-to-image",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"format": "jpg", "dpi": "150"})
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "single"
    print(f"    Image: {data['filename']}, {data['size']} bytes")

# Test 14: Image to PDF
def test_image_to_pdf():
    # First convert PDF to image, then convert back
    with open("test1.pdf", "rb") as f:
        res = requests.post(f"{base}/convert/pdf-to-image",
                          files={"file": ("test1.pdf", f, "application/pdf")},
                          data={"format": "jpg", "dpi": "150"})
    img_data = res.json()
    
    # Download the image
    dl = requests.get(f"{base}/files/download/{img_data['file_id']}")
    assert dl.status_code == 200
    
    # Convert image back to PDF
    res2 = requests.post(f"{base}/convert/image-to-pdf",
                        files=[("files", ("page.jpg", dl.content, "image/jpeg"))])
    assert res2.status_code == 200
    data = res2.json()
    assert "file_id" in data
    print(f"    Image->PDF: {data['size']} bytes")

# Test 15: Download
def test_download():
    with open("test1.pdf", "rb") as f:
        res = requests.post(f"{base}/pdf/info", files={"file": ("test1.pdf", f, "application/pdf")})
    # Merge to get a file_id
    with open("test1.pdf", "rb") as f1, open("test2.pdf", "rb") as f2:
        res = requests.post(f"{base}/pdf/merge", files=[
            ("files", ("test1.pdf", f1, "application/pdf")),
            ("files", ("test2.pdf", f2, "application/pdf")),
        ])
    file_id = res.json()["file_id"]
    dl = requests.get(f"{base}/files/download/{file_id}")
    assert dl.status_code == 200
    assert len(dl.content) > 0
    print(f"    Downloaded: {len(dl.content)} bytes")


if __name__ == "__main__":
    print("=" * 50)
    print("PDF Tool API - Integration Tests")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health),
        ("PDF Info", test_info),
        ("Merge PDFs", test_merge),
        ("Thumbnails", test_thumbnails),
        ("Split PDF", test_split),
        ("Extract Pages", test_extract),
        ("Delete Pages", test_delete),
        ("Reorder Pages", test_reorder),
        ("Rotate Pages", test_rotate),
        ("Compress PDF", test_compress),
        ("Watermark", test_watermark),
        ("Page Numbers", test_page_numbers),
        ("PDF to Image", test_pdf_to_image),
        ("Image to PDF", test_image_to_pdf),
        ("Download File", test_download),
    ]
    
    for name, func in tests:
        test(name, func)
    
    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed, {passed + failed} total")
    print("=" * 50)
    
    if failed > 0:
        sys.exit(1)
