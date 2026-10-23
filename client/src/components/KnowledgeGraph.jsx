import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * KnowledgeGraph Component
 * 
 * Demonstrates:
 * 1. Force-Directed Graph Layout: Physics-based node positioning (repulsion, attraction, center gravity).
 * 2. Real Data Integration: Built directly from MongoDB-backed notes.
 * 3. Dynamic Relationship Logic:
 *    - Shared Tags: Strong connection, neon pink edge (`#ff2a85`).
 *    - Shared Category: Contextual connection, neon lavender dashed edge (`#c084fc`).
 * 4. Interactive Navigation: Zoom, Pan, Dragging, Search Highlighting, Fit-to-Screen, and Inspector Drawer.
 */
export default function KnowledgeGraph({
  notes = [],
  isLoading = false,
  error = null,
  onRetry,
  onEditNote,
}) {
  const canvasRef = useRef(null);

  // Graph interaction states
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [graphSearch, setGraphSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Physics simulation nodes and edges state
  const simulationRef = useRef({
    nodes: [],
    links: [],
    animId: null,
    alpha: 1, // Energy of simulation (decays to 0 as graph stabilizes)
  });

  // Calculate relationships between notes
  const graphData = useMemo(() => {
    if (!notes || notes.length === 0) {
      return { nodes: [], links: [] };
    }

    const nodes = notes.map((note, index) => {
      // Retain previous positions if node already existed to prevent jarring jumps
      const existing = simulationRef.current.nodes.find((n) => n.id === note.id);
      const angle = (index / notes.length) * 2 * Math.PI;
      const initialRadius = 160 + (index % 3) * 40;

      return {
        id: note.id || note._id,
        rawNote: note,
        title: note.title,
        category: note.category || 'General',
        description: note.description,
        tags: Array.isArray(note.tags) ? note.tags : [],
        updatedAt: note.updatedAt,
        x: existing ? existing.x : 400 + Math.cos(angle) * initialRadius,
        y: existing ? existing.y : 300 + Math.sin(angle) * initialRadius,
        vx: 0,
        vy: 0,
        radius: 26,
      };
    });

    const links = [];

    // Pairwise relationship discovery
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        const aTags = a.tags.map((t) => String(t).trim().toLowerCase());
        const bTags = b.tags.map((t) => String(t).trim().toLowerCase());
        const sharedTags = aTags.filter((t) => bTags.includes(t));

        // Rule 1: Shared Tags (Strong Connection)
        if (sharedTags.length > 0) {
          links.push({
            source: a.id,
            target: b.id,
            type: 'tag',
            label: sharedTags.map((t) => `#${t}`).join(', '),
            strength: Math.min(sharedTags.length * 0.4, 1.2),
            color: '#ff2a85',
          });
        }
        // Rule 2: Shared Category (Contextual Connection)
        else if (
          a.category &&
          b.category &&
          a.category.trim().toLowerCase() === b.category.trim().toLowerCase()
        ) {
          links.push({
            source: a.id,
            target: b.id,
            type: 'category',
            label: `Topic: ${a.category}`,
            strength: 0.35,
            color: '#c084fc',
          });
        }
      }
    }

    return { nodes, links };
  }, [notes]);

  // Sync simulation reference whenever graphData updates
  useEffect(() => {
    simulationRef.current.nodes = graphData.nodes;
    simulationRef.current.links = graphData.links;
    simulationRef.current.alpha = 1; // Re-energize layout simulation
  }, [graphData]);

  // Center / Fit to screen helper
  const handleFitToScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || simulationRef.current.nodes.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const nodes = simulationRef.current.nodes;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const graphWidth = maxX - minX + 160;
    const graphHeight = maxY - minY + 160;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newZoom = Math.max(
      0.4,
      Math.min(1.4, Math.min(rect.width / graphWidth, rect.height / graphHeight))
    );

    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom,
    });
  }, []);

  // Run Fit to Screen once on initial load with data
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const timer = setTimeout(handleFitToScreen, 150);
      return () => clearTimeout(timer);
    }
  }, [graphData.nodes.length, handleFitToScreen]);

  // Physics & Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear Canvas Background
      ctx.fillStyle = '#080c16';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw subtle futuristic cybernetic grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const dotSpacing = 36 * zoom;
      const startX = (pan.x % dotSpacing + dotSpacing) % dotSpacing;
      const startY = (pan.y % dotSpacing + dotSpacing) % dotSpacing;

      for (let x = startX; x < rect.width; x += dotSpacing) {
        for (let y = startY; y < rect.height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const { nodes, links, alpha } = simulationRef.current;

      // -------------------------------------------------------------
      // 1. Force Simulation Step (Runs while alpha > 0.005)
      // -------------------------------------------------------------
      if (alpha > 0.005) {
        const centerGravityX = rect.width / (2 * zoom) - pan.x / zoom;
        const centerGravityY = rect.height / (2 * zoom) - pan.y / zoom;

        // A. Repulsion between all pairs of nodes
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const na = nodes[i];
            const nb = nodes[j];
            const dx = nb.x - na.x;
            const dy = nb.y - na.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 320) {
              const force = (320 - dist) / dist * 0.8 * alpha;
              na.vx -= dx * force;
              na.vy -= dy * force;
              nb.vx += dx * force;
              nb.vy += dy * force;
            }
          }
        }

        // B. Spring attraction along links
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        links.forEach((link) => {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = link.type === 'tag' ? 140 : 190;
          const force = (dist - idealDist) / dist * link.strength * 0.12 * alpha;

          source.vx += dx * force;
          source.vy += dy * force;
          target.vx -= dx * force;
          target.vy -= dy * force;
        });

        // C. Center gravity & position updates
        nodes.forEach((n) => {
          if (draggedNode && n.id === draggedNode.id) return; // Don't move actively dragged node

          const gdx = centerGravityX - n.x;
          const gdy = centerGravityY - n.y;
          n.vx += gdx * 0.015 * alpha;
          n.vy += gdy * 0.015 * alpha;

          // Apply damping / friction
          n.vx *= 0.82;
          n.vy *= 0.82;

          n.x += n.vx;
          n.y += n.vy;
        });

        simulationRef.current.alpha *= 0.985; // Natural decay to rest
      }

      // -------------------------------------------------------------
      // 2. Render Graph with Camera Transform
      // -------------------------------------------------------------
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Query matching nodes for search highlighting
      const query = graphSearch.trim().toLowerCase();
      const isSearching = query.length > 0;

      // Draw Links
      links.forEach((link) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return;

        const isRelatedToSelected =
          selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id);
        const isRelatedToHovered =
          hoveredNode && (source.id === hoveredNode.id || target.id === hoveredNode.id);

        let opacity = 0.35;
        let lineWidth = link.type === 'tag' ? 2 : 1.2;

        if (isRelatedToSelected || isRelatedToHovered) {
          opacity = 0.95;
          lineWidth = link.type === 'tag' ? 3.5 : 2.5;
        } else if (isSearching) {
          const matchSource = source.title.toLowerCase().includes(query);
          const matchTarget = target.title.toLowerCase().includes(query);
          opacity = matchSource || matchTarget ? 0.75 : 0.08;
        }

        ctx.save();
        ctx.strokeStyle = link.color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = lineWidth;

        if (link.type === 'category') {
          ctx.setLineDash([6, 6]);
        }

        if (isRelatedToSelected || isRelatedToHovered) {
          ctx.shadowColor = link.color;
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isMatched = !isSearching || node.title.toLowerCase().includes(query);

        const nodeAlpha = isMatched ? 1 : 0.2;
        const radius = isSelected ? 30 : isHovered ? 28 : node.radius;

        ctx.save();
        ctx.globalAlpha = nodeAlpha;

        // Glowing outer halo for active/hovered node
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? 'rgba(255, 42, 133, 0.25)'
            : 'rgba(192, 132, 252, 0.2)';
          ctx.fill();
        }

        // Node base circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#1c1b30' : '#101626';
        ctx.fill();

        // Node Neon Border
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeStyle = isSelected
          ? '#ff2a85'
          : isHovered
          ? '#00f0ff'
          : 'rgba(255, 255, 255, 0.3)';
        ctx.shadowColor = isSelected ? '#ff2a85' : isHovered ? '#00f0ff' : 'transparent';
        ctx.shadowBlur = isSelected || isHovered ? 12 : 0;
        ctx.stroke();

        // Center Sakura motif
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌸', node.x, node.y);

        // Node Title Label
        const displayTitle =
          node.title.length > 20 ? node.title.slice(0, 18) + '...' : node.title;

        ctx.font = isSelected ? 'bold 12px sans-serif' : '11px sans-serif';
        const textMetrics = ctx.measureText(displayTitle);
        const padding = 5;
        const textY = node.y + radius + 14;

        // Pill background behind label for high contrast
        ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
        ctx.fillRect(
          node.x - textMetrics.width / 2 - padding,
          textY - 9,
          textMetrics.width + padding * 2,
          18
        );

        ctx.fillStyle = isSelected ? '#ff2a85' : '#f8fafc';
        ctx.fillText(displayTitle, node.x, textY);

        ctx.restore();
      });

      ctx.restore(); // Restore camera transform
      ctx.restore(); // Restore dpr scale

      simulationRef.current.animId = requestAnimationFrame(render);
    };

    simulationRef.current.animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (simulationRef.current.animId) {
        cancelAnimationFrame(simulationRef.current.animId);
      }
    };
  }, [pan, zoom, selectedNode, hoveredNode, graphSearch, draggedNode]);

  // Find node at screen coordinates (accounting for zoom and pan)
  const getNodeAtPoint = (screenX, screenY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - pan.x) / zoom;
    const y = (screenY - rect.top - pan.y) / zoom;

    const nodes = simulationRef.current.nodes;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy <= node.radius * node.radius) {
        return node;
      }
    }
    return null;
  };

  // Mouse Handlers
  const handleMouseDown = (e) => {
    const hitNode = getNodeAtPoint(e.clientX, e.clientY);
    if (hitNode) {
      setDraggedNode(hitNode);
      setSelectedNode(hitNode);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    } else {
      setIsDraggingCanvas(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    if (draggedNode) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      draggedNode.x = (e.clientX - rect.left - pan.x) / zoom;
      draggedNode.y = (e.clientY - rect.top - pan.y) / zoom;
      simulationRef.current.alpha = 0.5; // Energize physics around dragged node
    } else if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    } else {
      const hit = getNodeAtPoint(e.clientX, e.clientY);
      setHoveredNode(hit);
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsDraggingCanvas(false);
  };

  // Zoom with mouse wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 3);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered around mouse position
    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Direct Zoom Button Handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev * 0.8, 0.3));

  // Connected nodes list for the inspector drawer
  const connectedNotes = useMemo(() => {
    if (!selectedNode) return [];
    const links = simulationRef.current.links;
    const nodes = simulationRef.current.nodes;

    const relations = [];
    links.forEach((link) => {
      if (link.source === selectedNode.id) {
        const targetNode = nodes.find((n) => n.id === link.target);
        if (targetNode) relations.push({ node: targetNode, link });
      } else if (link.target === selectedNode.id) {
        const sourceNode = nodes.find((n) => n.id === link.source);
        if (sourceNode) relations.push({ node: sourceNode, link });
      }
    });

    return relations;
  }, [selectedNode]);

  return (
    <div className="knowledge-graph-container">
      {/* Top Floating Controls Bar */}
      <div className="graph-controls-bar">
        <div className="graph-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="graph-search-input"
            placeholder="Highlight graph nodes..."
            value={graphSearch}
            onChange={(e) => setGraphSearch(e.target.value)}
          />
          {graphSearch && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setGraphSearch('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="graph-legend">
          <div className="legend-item">
            <span className="legend-line line-tag"></span>
            <span>Shared Tags</span>
          </div>
          <div className="legend-item">
            <span className="legend-line line-category"></span>
            <span>Same Category</span>
          </div>
        </div>

        {/* Zoom & Canvas Actions */}
        <div className="graph-action-buttons">
          <button
            type="button"
            className="graph-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
          >
            ＋
          </button>
          <button
            type="button"
            className="graph-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            －
          </button>
          <button
            type="button"
            className="graph-btn"
            onClick={handleFitToScreen}
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="graph-canvas-wrapper">
        {isLoading && (
          <div className="loading-state-container graph-overlay-state">
            <span className="loading-spinner">🌸</span>
            <h3 className="loading-title">Rendering Synaptic Graph...</h3>
            <p className="loading-subtitle">
              Computing node distances and neural connections from MongoDB
            </p>
          </div>
        )}

        {!isLoading && error && (
          <div className="error-state-container graph-overlay-state">
            <div className="error-icon">⚠️</div>
            <h3 className="error-title">Failed to Load Knowledge Graph</h3>
            <p className="error-message">{error}</p>
            {onRetry && (
              <button type="button" className="btn btn-primary" onClick={onRetry}>
                ⚡ Retry Connection
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && notes.length === 0 && (
          <div className="notes-empty-state graph-overlay-state">
            <div className="empty-icon">🌸</div>
            <h3 className="empty-title">Your Knowledge Mesh is Empty</h3>
            <p className="empty-description">
              Create knowledge nodes in the Dashboard. Notes sharing tags or categories
              will automatically form glowing synaptic links in this space!
            </p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="graph-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <aside className="node-inspector-drawer" aria-label="Node Inspector">
          <div className="inspector-header">
            <div className="inspector-title-wrap">
              <span className="inspector-sakura">🌸</span>
              <span className="inspector-badge">{selectedNode.category}</span>
            </div>
            <button
              type="button"
              className="inspector-close-btn"
              onClick={() => setSelectedNode(null)}
              aria-label="Close Inspector"
            >
              ✕
            </button>
          </div>

          <h2 className="inspector-title">{selectedNode.title}</h2>
          <p className="inspector-description">{selectedNode.description}</p>

          <div className="inspector-section">
            <h3 className="inspector-subheading">TAGS</h3>
            <div className="note-tags">
              {selectedNode.tags.map((tag, i) => (
                <span key={`${tag}-${i}`} className="note-tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="inspector-section">
            <h3 className="inspector-subheading">
              SYNAPTIC CONNECTIONS ({connectedNotes.length})
            </h3>
            {connectedNotes.length > 0 ? (
              <ul className="connected-nodes-list">
                {connectedNotes.map(({ node, link }) => (
                  <li
                    key={node.id}
                    className="connected-node-item"
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="connected-node-title">
                      🌸 {node.title}
                    </div>
                    <span
                      className={`connected-relation-badge ${
                        link.type === 'tag' ? 'badge-tag' : 'badge-category'
                      }`}
                    >
                      {link.label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="inspector-subtext">
                No active connections. Add matching tags with other notes to form synaptic bridges!
              </p>
            )}
          </div>

          <div className="inspector-actions">
            {onEditNote && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onEditNote(selectedNode.rawNote);
                  setSelectedNode(null);
                }}
              >
                ✏️ Edit Knowledge Node
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
