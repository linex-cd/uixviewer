import React, { useState, useRef } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCcw, Search, Eye, Layers } from 'lucide-react';

export default function UIXViewer() {
  const [uiData, setUiData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);
  const [allNodes, setAllNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const screenshotRef = useRef(null);

  // 从URL参数加载文件
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uixUrl = params.get('uix');
    const imgUrl = params.get('img') || params.get('screenshot');

    if (uixUrl || imgUrl) {
      loadFromUrls(uixUrl, imgUrl);
    }
  }, []);

  const loadFromUrls = async (uixUrl, imgUrl) => {
    setLoading(true);
    setError(null);

    try {
      // 加载 UIX 文件
      if (uixUrl) {
        const uixResponse = await fetch(uixUrl);
        if (!uixResponse.ok) throw new Error(`加载 UIX 失败: ${uixResponse.statusText}`);
        const uixText = await uixResponse.text();
        const { root, allNodes } = parseUIX(uixText);
        setUiData(root);
        setAllNodes(allNodes);
        setExpandedNodes(new Set([root.id]));
      }

      // 加载截图
      if (imgUrl) {
        const imgResponse = await fetch(imgUrl);
        if (!imgResponse.ok) throw new Error(`加载截图失败: ${imgResponse.statusText}`);
        const blob = await imgResponse.blob();
        const reader = new FileReader();
        reader.onload = (e) => setScreenshot(e.target.result);
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      setError(err.message);
      console.error('加载远程文件失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseUIX = (xmlText) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const nodes = [];
    
    const parseNode = (element, depth = 0) => {
      const bounds = element.getAttribute('bounds');
      let rect = null;
      if (bounds) {
        const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
        if (match) {
          rect = {
            left: parseInt(match[1]),
            top: parseInt(match[2]),
            right: parseInt(match[3]),
            bottom: parseInt(match[4]),
            width: parseInt(match[3]) - parseInt(match[1]),
            height: parseInt(match[4]) - parseInt(match[2])
          };
        }
      }

      // 获取所有属性
      const attributes = {};
      Array.from(element.attributes).forEach(attr => {
        attributes[attr.name] = attr.value;
      });

      const node = {
        id: Math.random().toString(36).substr(2, 9),
        tag: element.tagName,
        // 标准属性
        index: element.getAttribute('index'),
        text: element.getAttribute('text') || '',
        resourceId: element.getAttribute('resource-id') || element.getAttribute('id') || '',
        className: element.getAttribute('class') || element.getAttribute('clz') || '',
        package: element.getAttribute('package') || element.getAttribute('pkg') || '',
        contentDesc: element.getAttribute('content-desc') || element.getAttribute('desc') || '',
        // 布尔属性
        checkable: element.getAttribute('checkable') === 'true',
        checked: element.getAttribute('checked') === 'true',
        clickable: element.getAttribute('clickable') === 'true',
        enabled: element.getAttribute('enabled') === 'true',
        focusable: element.getAttribute('focusable') === 'true',
        focused: element.getAttribute('focused') === 'true',
        scrollable: element.getAttribute('scrollable') === 'true',
        longClickable: element.getAttribute('long-clickable') === 'true' || element.getAttribute('longclickable') === 'true',
        password: element.getAttribute('password') === 'true',
        selected: element.getAttribute('selected') === 'true',
        visible: element.getAttribute('visible') === 'true',
        multiline: element.getAttribute('multiline') === 'true',
        dismissable: element.getAttribute('dismissable') === 'true',
        editable: element.getAttribute('editable') === 'true',
        // 额外属性
        drawingOrder: element.getAttribute('drawingorder'),
        layer: element.getAttribute('layer'),
        nid: element.getAttribute('nid'),
        parentId: element.getAttribute('parentid'),
        childCount: element.getAttribute('childcount'),
        left: element.getAttribute('left'),
        top: element.getAttribute('top'),
        right: element.getAttribute('right'),
        bottom: element.getAttribute('bottom'),
        bounds,
        rect,
        depth,
        // 保存所有原始属性
        allAttributes: attributes,
        children: []
      };

      nodes.push(node);

      Array.from(element.children).forEach(child => {
        node.children.push(parseNode(child, depth + 1));
      });

      return node;
    };

    const root = doc.documentElement;
    const parsedRoot = parseNode(root);
    return { root: parsedRoot, allNodes: nodes };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const { root, allNodes } = parseUIX(event.target.result);
          setUiData(root);
          setAllNodes(allNodes);
          setExpandedNodes(new Set([root.id]));
          setSelectedNode(null);
        } catch (error) {
          alert('解析文件失败: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshot(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotClick = (e) => {
    if (!screenshotRef.current || !allNodes.length) return;

    const rect = screenshotRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    // Find the smallest node that contains the click point
    let bestMatch = null;
    let smallestArea = Infinity;

    for (const node of allNodes) {
      if (node.rect) {
        const { left, top, right, bottom } = node.rect;
        if (x >= left && x <= right && y >= top && y <= bottom) {
          const area = (right - left) * (bottom - top);
          if (area < smallestArea) {
            smallestArea = area;
            bestMatch = node;
          }
        }
      }
    }

    if (bestMatch) {
      setSelectedNode(bestMatch);
      // Expand parent nodes to make it visible
      expandPathToNode(bestMatch);
    }
  };

  const expandPathToNode = (targetNode) => {
    const newExpanded = new Set(expandedNodes);
    
    const findAndExpandParent = (node) => {
      if (node.id === targetNode.id) return true;
      
      for (const child of node.children) {
        if (findAndExpandParent(child)) {
          newExpanded.add(node.id);
          return true;
        }
      }
      return false;
    };

    if (uiData) {
      findAndExpandParent(uiData);
      setExpandedNodes(newExpanded);
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const searchNodes = (node, term) => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return (
      node.text?.toLowerCase().includes(lowerTerm) ||
      node.resourceId?.toLowerCase().includes(lowerTerm) ||
      node.className?.toLowerCase().includes(lowerTerm) ||
      node.contentDesc?.toLowerCase().includes(lowerTerm)
    );
  };

  const renderTree = (node, parentVisible = true) => {
    if (!node) return null;
    
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const matchesSearch = searchNodes(node, searchTerm);
    const visible = parentVisible && matchesSearch;

    if (!visible && !node.children.some(child => searchNodes(child, searchTerm))) {
      return null;
    }

    const label = node.className?.split('.').pop() || node.tag;
    const identifier = node.text || node.resourceId || node.contentDesc;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100 border-l-2 border-blue-500' : ''
          } ${!visible ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {node.children.length > 0 && (
            <span
              className="mr-1 text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="text-sm font-mono">
            <span className="text-blue-600">{label}</span>
            {identifier && (
              <span className="text-gray-600 ml-2">
                {identifier.length > 30 ? identifier.substring(0, 30) + '...' : identifier}
              </span>
            )}
          </span>
        </div>
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderTree(child, visible))}
          </div>
        )}
      </div>
    );
  };

  const renderProperties = () => {
    if (!selectedNode) {
      return <div className="p-4 text-gray-500">选择一个节点查看属性</div>;
    }

    const props = [
      { label: 'Class', value: selectedNode.className },
      { label: 'Resource ID', value: selectedNode.resourceId },
      { label: 'Text', value: selectedNode.text },
      { label: 'Content Description', value: selectedNode.contentDesc },
      { label: 'Package', value: selectedNode.package },
      { label: 'Index', value: selectedNode.index },
      { label: 'Drawing Order', value: selectedNode.drawingOrder },
      { label: 'Layer', value: selectedNode.layer },
      { label: 'Depth', value: selectedNode.depth?.toString() },
      { label: 'Node ID', value: selectedNode.nid },
      { label: 'Parent ID', value: selectedNode.parentId },
      { label: 'Child Count', value: selectedNode.childCount },
      { label: 'Bounds', value: selectedNode.bounds },
      { label: 'Left', value: selectedNode.left || selectedNode.rect?.left?.toString() },
      { label: 'Top', value: selectedNode.top || selectedNode.rect?.top?.toString() },
      { label: 'Right', value: selectedNode.right || selectedNode.rect?.right?.toString() },
      { label: 'Bottom', value: selectedNode.bottom || selectedNode.rect?.bottom?.toString() },
      { label: 'Width', value: selectedNode.rect?.width?.toString() },
      { label: 'Height', value: selectedNode.rect?.height?.toString() },
    ];

    const boolProps = [
      { label: 'Clickable', value: selectedNode.clickable },
      { label: 'Long Clickable', value: selectedNode.longClickable },
      { label: 'Enabled', value: selectedNode.enabled },
      { label: 'Focusable', value: selectedNode.focusable },
      { label: 'Focused', value: selectedNode.focused },
      { label: 'Scrollable', value: selectedNode.scrollable },
      { label: 'Checkable', value: selectedNode.checkable },
      { label: 'Checked', value: selectedNode.checked },
      { label: 'Selected', value: selectedNode.selected },
      { label: 'Password', value: selectedNode.password },
      { label: 'Visible', value: selectedNode.visible },
      { label: 'Multiline', value: selectedNode.multiline },
      { label: 'Dismissable', value: selectedNode.dismissable },
      { label: 'Editable', value: selectedNode.editable },
    ];

    return (
      <div className="p-4 overflow-auto">
        <h3 className="font-bold mb-3 text-lg">节点属性</h3>
        
        {/* 基本信息 */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">基本信息</h4>
          <div className="space-y-2">
            {props.map((prop, idx) => (
              prop.value && (
                <div key={idx} className="border-b pb-2">
                  <div className="text-xs text-gray-600 font-semibold">{prop.label}</div>
                  <div className="text-sm break-all">{prop.value}</div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* 布尔属性 */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">状态属性</h4>
          <div className="grid grid-cols-2 gap-2">
            {boolProps.map((prop, idx) => {
              const isTrue = prop.value === true;
              const isFalse = prop.value === false;
              if (!isTrue && !isFalse) return null;
              return (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className={`w-3 h-3 rounded ${isTrue ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className={isTrue ? 'text-gray-900' : 'text-gray-500'}>{prop.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 所有原始属性 */}
        {selectedNode.allAttributes && Object.keys(selectedNode.allAttributes).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">所有属性</h4>
            <div className="space-y-1 text-xs font-mono bg-gray-50 p-2 rounded max-h-64 overflow-auto">
              {Object.entries(selectedNode.allAttributes).map(([key, value], idx) => (
                <div key={idx} className="flex">
                  <span className="text-blue-600 mr-2">{key}:</span>
                  <span className="text-gray-700 break-all">"{value}"</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOverlay = () => {
    if (!selectedNode?.rect || !screenshot) return null;

    const { left, top, width, height } = selectedNode.rect;

    return (
      <div
        className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20 pointer-events-none"
        style={{
          left: `${left * zoom}px`,
          top: `${top * zoom}px`,
          width: `${width * zoom}px`,
          height: `${height * zoom}px`,
        }}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="text-blue-600" size={24} />
          <h1 className="text-xl font-bold">UIX 解析预览器</h1>
          {loading && <span className="text-sm text-gray-500 ml-4">加载中...</span>}
          {error && <span className="text-sm text-red-500 ml-4">错误: {error}</span>}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Upload size={16} />
            上传 UIX 文件
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Upload size={16} />
            上传截图
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.uix"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tree View */}
        <div className="w-1/3 bg-white border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜索节点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">加载中...</div>
            ) : uiData ? (
              renderTree(uiData)
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p className="mb-2">请上传 UIX 文件开始分析</p>
                <p className="text-xs text-gray-400">
                  或使用 URL 参数：?uix=文件地址&img=图片地址
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Screenshot */}
        <div className="flex-1 bg-gray-100 flex flex-col">
          <div className="bg-white border-b px-3 py-2 flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.1, 3))}
              className="p-2 hover:bg-gray-100 rounded"
              title="放大"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}
              className="p-2 hover:bg-gray-100 rounded"
              title="缩小"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 hover:bg-gray-100 rounded"
              title="重置"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`p-2 hover:bg-gray-100 rounded ${showOverlay ? 'bg-blue-100' : ''}`}
              title="切换覆盖层"
            >
              <Eye size={18} />
            </button>
            <span className="ml-auto text-sm text-gray-600">
              缩放: {(zoom * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {screenshot ? (
              <div 
                className="relative inline-block cursor-crosshair"
                onClick={handleScreenshotClick}
              >
                <img
                  ref={screenshotRef}
                  src={screenshot}
                  alt="Screenshot"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  className="max-w-none"
                />
                {showOverlay && renderOverlay()}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                上传截图以查看 UI 布局
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-1/4 bg-white border-l overflow-auto">
          {renderProperties()}
        </div>
      </div>
    </div>
  );
}