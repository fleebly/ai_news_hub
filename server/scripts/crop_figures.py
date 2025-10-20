#!/usr/bin/env python3
"""
图表裁剪脚本
根据视觉模型返回的边界框坐标，从整页图片中裁剪出核心图表部分
"""

import sys
import json
import base64
from io import BytesIO
from PIL import Image


def crop_figure(image_base64, bbox, padding=0.005):
    """
    从base64图片中裁剪指定区域（精确裁剪）
    
    Args:
        image_base64: base64编码的图片（可以是data URI或纯base64）
        bbox: 边界框字典 {"x": 0.1, "y": 0.2, "width": 0.8, "height": 0.6}
        padding: 额外的边距（相对值，默认0.5%）- 减少到最小以保证精确裁剪
    
    Returns:
        裁剪后的图片的base64编码（data URI格式）
    """
    try:
        # 提取纯base64数据
        if image_base64.startswith('data:image'):
            # 是data URI，提取base64部分
            base64_data = image_base64.split(',')[1]
        else:
            # 已经是纯base64
            base64_data = image_base64
        
        # 解码图片
        image_bytes = base64.b64decode(base64_data)
        img = Image.open(BytesIO(image_bytes))
        
        width, height = img.size
        
        # 计算实际像素坐标
        # 使用最小padding以保证精确裁剪
        # 如果视觉模型已经精确标注，padding应该非常小
        x = max(0, int((bbox['x'] - padding) * width))
        y = max(0, int((bbox['y'] - padding) * height))
        w = min(width - x, int((bbox['width'] + padding * 2) * width))
        h = min(height - y, int((bbox['height'] + padding * 2) * height))
        
        # 确保裁剪区域有效
        if w <= 0 or h <= 0:
            # 如果计算出的区域无效，使用原始bbox不加padding
            x = int(bbox['x'] * width)
            y = int(bbox['y'] * height)
            w = int(bbox['width'] * width)
            h = int(bbox['height'] * height)
        
        # 裁剪图片
        cropped = img.crop((x, y, x + w, y + h))
        
        # 转换为base64（提高质量到98）
        buffered = BytesIO()
        cropped.save(buffered, format="JPEG", quality=98, optimize=True)
        cropped_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        # 返回完整的data URI
        return f'data:image/jpeg;base64,{cropped_base64}'
        
    except Exception as e:
        print(f"Error cropping image: {str(e)}", file=sys.stderr)
        # 如果裁剪失败，返回原图
        return image_base64


def main():
    """
    主函数：从stdin读取JSON输入，处理后输出到stdout
    
    输入格式：
    {
      "images": [
        {
          "index": 0,
          "base64": "data:image/jpeg;base64,...",
          "bbox": {"x": 0.1, "y": 0.2, "width": 0.8, "height": 0.6}
        },
        ...
      ]
    }
    
    输出格式：
    {
      "success": true,
      "croppedImages": [
        {
          "index": 0,
          "base64": "data:image/jpeg;base64,...",
          "cropped": true/false
        },
        ...
      ]
    }
    """
    try:
        # 从stdin读取输入
        input_data = json.loads(sys.stdin.read())
        
        images = input_data.get('images', [])
        cropped_images = []
        
        for img_data in images:
            index = img_data.get('index')
            base64_str = img_data.get('base64')
            bbox = img_data.get('bbox')
            
            if bbox and all(k in bbox for k in ['x', 'y', 'width', 'height']):
                # 有有效的bbox，进行裁剪
                cropped_base64 = crop_figure(base64_str, bbox)
                cropped_images.append({
                    'index': index,
                    'base64': cropped_base64,
                    'cropped': True
                })
            else:
                # 没有bbox或bbox无效，返回原图
                cropped_images.append({
                    'index': index,
                    'base64': base64_str,
                    'cropped': False
                })
        
        # 输出结果
        result = {
            'success': True,
            'croppedImages': cropped_images
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # 输出错误
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == '__main__':
    main()

