#!/usr/bin/env python3
"""
PDF转图片转换脚本
被Node.js服务调用，将PDF转换为base64编码的图片
"""

import sys
import json
import base64
from io import BytesIO

try:
    from pdf2image import convert_from_bytes
    import requests
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "缺少依赖库。请运行: pip install pdf2image pillow requests"
    }))
    sys.exit(1)


def download_pdf(url, timeout=30):
    """下载PDF文件"""
    try:
        response = requests.get(url, timeout=timeout, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; PDFConverter/1.0)'
        })
        response.raise_for_status()
        return response.content
    except Exception as e:
        raise Exception(f"下载PDF失败: {str(e)}")


def convert_to_images(pdf_content, max_pages=5, dpi=150):
    """将PDF转换为图片"""
    try:
        images = convert_from_bytes(
            pdf_content,
            dpi=dpi,
            first_page=1,
            last_page=max_pages,
            fmt='jpeg',
            thread_count=2  # 多线程加速
        )
        return images
    except Exception as e:
        raise Exception(f"转换PDF失败: {str(e)}")


def image_to_base64(image, quality=85):
    """将PIL Image转换为base64"""
    buffered = BytesIO()
    image.save(buffered, format="JPEG", quality=quality, optimize=True)
    return base64.b64encode(buffered.getvalue()).decode('utf-8')


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "用法: python pdf_converter.py <pdf_url> [max_pages] [dpi] [quality]"
        }))
        sys.exit(1)

    # 解析参数
    pdf_url = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 150
    quality = int(sys.argv[4]) if len(sys.argv) > 4 else 85

    try:
        # 1. 下载PDF
        pdf_content = download_pdf(pdf_url)
        
        # 2. 转换为图片
        images = convert_to_images(pdf_content, max_pages, dpi)
        
        # 3. 转换为base64
        images_base64 = []
        for img in images:
            b64 = image_to_base64(img, quality)
            images_base64.append(b64)
        
        # 4. 输出结果（JSON格式）
        result = {
            "success": True,
            "images": images_base64,
            "metadata": {
                "pdfUrl": pdf_url,
                "pageCount": len(images),
                "dpi": dpi,
                "quality": quality
            }
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # 输出错误（JSON格式）
        result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(result))
        sys.exit(1)


if __name__ == "__main__":
    main()

