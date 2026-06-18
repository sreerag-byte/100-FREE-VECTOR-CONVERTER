import React, { useState, useRef, useEffect } from 'react';
import ImageTracer from 'imagetracerjs';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Code2, 
  Download, 
  Check, 
  Settings, 
  Copy, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  FolderDown,
  RefreshCw,
  Maximize2,
  Shield,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Define the exact customizable options list for our special vector presets
interface CustomTracerOptions {
  corsenabled?: boolean;
  ltres?: number;
  qtres?: number;
  pathomit?: number;
  rightangleenhance?: boolean;
  colorsampling?: number;
  numberofcolors?: number;
  mincolorratio?: number;
  colorquantcycles?: number;
  strokewidth?: number;
  linefilter?: boolean;
  scale?: number;
  roundcoords?: number;
  viewbox?: boolean;
  blurradius?: number;
  blurdelta?: number;
  pal?: Array<{ r: number; g: number; b: number; a: number }>;
}

type PresetType = "logo" | "ui_element" | "flat_illustration" | "high_def_photo" | "bw_silhouette" | "general_balanced";

const PRESETS: { id: PresetType; label: string; description: string; options: CustomTracerOptions }[] = [
  { 
    id: 'logo', 
    label: 'High Precision Logo', 
    description: 'Crisp corners and solid colors. Perfect for brand logo designs.',
    options: {
      numberofcolors: 8,
      ltres: 0.05,
      qtres: 0.05,
      pathomit: 2,
      rightangleenhance: true,
      blurradius: 0,
      roundcoords: 2,
      colorquantcycles: 4,
      colorsampling: 2,
      viewbox: true
    }
  },
  { 
    id: 'ui_element', 
    label: 'UI Elements & Icons', 
    description: 'Perfect for screenshots, buttons, and system graphic elements.',
    options: {
      numberofcolors: 16,
      ltres: 0.02,
      qtres: 0.02,
      pathomit: 1,
      rightangleenhance: true,
      blurradius: 0,
      roundcoords: 3,
      colorquantcycles: 4,
      colorsampling: 2,
      viewbox: true
    }
  },
  { 
    id: 'general_balanced', 
    label: 'Balanced General', 
    description: 'Recommended for general pictures, graphics and drawings.',
    options: {
      numberofcolors: 16,
      ltres: 1.0,
      qtres: 1.0,
      pathomit: 8,
      rightangleenhance: true,
      blurradius: 0,
      roundcoords: 1,
      colorquantcycles: 3,
      colorsampling: 2,
      viewbox: true
    }
  },
  { 
    id: 'flat_illustration', 
    label: 'Illustration Art', 
    description: 'Flowing natural curves and smooth flat gradients.',
    options: {
      numberofcolors: 24,
      ltres: 1.5,
      qtres: 1.5,
      pathomit: 12,
      rightangleenhance: false,
      blurradius: 1,
      roundcoords: 1,
      colorquantcycles: 3,
      colorsampling: 2,
      viewbox: true
    }
  },
  { 
    id: 'high_def_photo', 
    label: 'High-Fidelity Photo', 
    description: 'Rich colors with highly detailed tracing style.',
    options: {
      numberofcolors: 48,
      ltres: 0.6,
      qtres: 0.6,
      pathomit: 3,
      rightangleenhance: false,
      blurradius: 0,
      roundcoords: 1,
      colorquantcycles: 3,
      colorsampling: 2,
      viewbox: true
    }
  },
  { 
    id: 'bw_silhouette', 
    label: 'Black & White Outline', 
    description: 'Clean shapes with purely dark black and bright white contrast.',
    options: {
      numberofcolors: 2,
      ltres: 0.1,
      qtres: 0.1,
      pathomit: 2,
      rightangleenhance: true,
      blurradius: 0,
      roundcoords: 2,
      colorquantcycles: 3,
      colorsampling: 2,
      viewbox: true,
      pal: [ { r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 } ]
    }
  }
];

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'preset' | 'custom'>('preset');
  const [activePreset, setActivePreset] = useState<PresetType>('logo');
  const [copied, setCopied] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  
  // Speed Limit Control
  const [resolutionLimit, setResolutionLimit] = useState<number>(600); // 600px default for instant lag-free feel
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [optimizedDimensions, setOptimizedDimensions] = useState<{ width: number; height: number } | null>(null);

  // Custom adjustments (simple and normal labels)
  const [colorLimitSetting, setColorLimitSetting] = useState<number>(16);
  const [smoothingSetting, setSmoothingSetting] = useState<number>(0); // Blur radius
  const [lineDetailLevel, setLineDetailLevel] = useState<number>(3); // 1 to 5
  const [borderThickness, setBorderThickness] = useState<number>(0); // 0 to 5
  const [sharpenCorners, setSharpenCorners] = useState<boolean>(true);
  const [cleanSpecks, setCleanSpecks] = useState<boolean>(true);
  const [decimalPrecision, setDecimalPrecision] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasDownloadedRef = useRef(false);

  // Stats calculation
  const pathCount = (svgResult?.match(/<path/g) || []).length;
  const sizeKbVal = svgResult ? (svgResult.length / 1024).toFixed(1) : "0";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file, resolutionLimit);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processSelectedFile(file, resolutionLimit);
    }
  };

  const preventDefault = (e: React.DragEvent) => e.preventDefault();

  const processSelectedFile = (file: File, limit: number) => {
    setOriginalImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        const img = new Image();
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
          
          let width = img.width;
          let height = img.height;
          
          // Image resize rules to eliminate any browser processing lag
          if (limit > 0 && (width > limit || height > limit)) {
            if (width > height) {
              height = Math.round((height * limit) / width);
              width = limit;
            } else {
              width = Math.round((width * limit) / height);
              height = limit;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL(file.type || 'image/png');
              setImageSrc(dataUrl);
              setOptimizedDimensions({ width, height });
            } else {
              setImageSrc(e.target.result as string);
              setOptimizedDimensions({ width: img.width, height: img.height });
            }
          } else {
            setImageSrc(e.target.result as string);
            setOptimizedDimensions({ width: img.width, height: img.height });
          }
          setSvgResult(null); // Clear previous trace output
        };
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResolutionSwitch = (limit: number) => {
    setResolutionLimit(limit);
    if (originalImageFile) {
      processSelectedFile(originalImageFile, limit);
    }
  };

  // Convert simple normal sliders to trace settings
  const generateCustomSettings = () => {
    let ltresVal = 1.0;
    let qtresVal = 1.0;
    let omitVal = 8;
    
    // Convert 1 to 5 slider values to internal errors
    if (lineDetailLevel === 1) {
      ltresVal = 3.5; qtresVal = 3.5; omitVal = 16;
    } else if (lineDetailLevel === 2) {
      ltresVal = 2.0; qtresVal = 2.0; omitVal = 10;
    } else if (lineDetailLevel === 3) {
      ltresVal = 1.0; qtresVal = 1.0; omitVal = 6;
    } else if (lineDetailLevel === 4) {
      ltresVal = 0.3; qtresVal = 0.3; omitVal = 2;
    } else if (lineDetailLevel === 5) {
      ltresVal = 0.05; qtresVal = 0.05; omitVal = 0;
    }

    return {
      numberofcolors: colorLimitSetting,
      blurradius: smoothingSetting,
      strokewidth: borderThickness,
      rightangleenhance: sharpenCorners,
      linefilter: cleanSpecks,
      viewbox: true,
      ltres: ltresVal,
      qtres: qtresVal,
      pathomit: omitVal,
      roundcoords: decimalPrecision,
      colorsampling: 2,
      colorquantcycles: 3
    };
  };

  const downloadSvgFile = (data?: string) => {
    const rawData = data || svgResult;
    if (!rawData || !originalImageFile) return;
    const blob = new Blob([rawData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const formattedName = originalImageFile.name.replace(/\.[^/.]+$/, "");
    link.download = `${formattedName}_vectorized.svg`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startConversion = () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    setSvgResult(null);
    hasDownloadedRef.current = false;

    // Retrieve requested configurations
    let targetOptions: CustomTracerOptions = {};
    if (settingsMode === 'preset') {
      const selected = PRESETS.find(p => p.id === activePreset);
      targetOptions = selected ? selected.options : PRESETS[0].options;
    } else {
      targetOptions = generateCustomSettings();
    }

    // Set timeout to draw safely and avoid main thread locking
    setTimeout(() => {
      try {
        ImageTracer.imageToSVG(
          imageSrc,
          (svgStr) => {
            setSvgResult(svgStr);
            setIsProcessing(false);
            
            // Auto download exactly 1 time if requested
            if (autoDownload && !hasDownloadedRef.current) {
              hasDownloadedRef.current = true;
              downloadSvgFile(svgStr);
            }
          },
          targetOptions as any
        );
      } catch (err) {
        console.error("Tracing error occurred", err);
        setIsProcessing(false);
      }
    }, 80);
  };

  const copyCodeToClip = () => {
    if (!svgResult) return;
    navigator.clipboard.writeText(svgResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    setImageSrc(null);
    setOriginalImageFile(null);
    setSvgResult(null);
    setOriginalDimensions(null);
    setOptimizedDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen text-white font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Navigation Block */}
        <header className="flex flex-col md:flex-row justify-between items-center p-6 glass rounded-2xl gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                VECTRA<span className="font-light text-green-400"> VECTOR</span>
              </h1>
              <p className="text-xs text-white/50 font-normal">Convert your images to high quality vector graphic shapes</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Offline Shield Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/5 rounded-full border border-green-500/20 text-[11px] text-green-400 font-medium">
              <Shield className="w-3.5 h-3.5" />
              Works offline (runs in browser)
            </div>
          </div>
        </header>

        {/* Speed Adjustment Bar */}
        {imageSrc && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 glass rounded-2xl gap-3 text-xs">
            <span className="text-white/70 font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              Adjust performance (reduces lag on weak devices)
            </span>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => handleResolutionSwitch(400)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  resolutionLimit === 400
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-white/40 hover:text-white'
                }`}
                title="Super fast conversion with tiny dimensions"
              >
                Super Fast (400px)
              </button>
              <button
                onClick={() => handleResolutionSwitch(600)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  resolutionLimit === 600
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-white/40 hover:text-white'
                }`}
                title="Default balanced resolution"
              >
                Standard (600px)
              </button>
              <button
                onClick={() => handleResolutionSwitch(0)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  resolutionLimit === 0
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-white/40 hover:text-white'
                }`}
                title="No resizing (can slow down for huge images)"
              >
                Highest Quality (Full)
              </button>
            </div>
          </div>
        )}

        <main className="space-y-6">
          {!imageSrc ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2"
            >
              <div
                className="drop-zone rounded-3xl p-10 md:p-20 text-center cursor-pointer hover:bg-green-500/5 duration-300 relative overflow-hidden group"
                onDrop={handleDrop}
                onDragOver={preventDefault}
                onDragEnter={preventDefault}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Emerald corner lights */}
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 via-transparent to-transparent pointer-events-none" />
                
                <input
                  type="file"
                  id="image-file-input"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                
                <div className="flex flex-col items-center gap-4 relative z-10">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Click or drag your image here to begin</h3>
                    <p className="text-white/40 text-xs mt-2 max-w-sm mx-auto">
                      Supports JPG, PNG, and WebP. Your images are safe and never uploaded to any remote server.
                    </p>
                  </div>
                  <button className="mt-2 px-5 py-2 btn-secondary text-xs font-semibold rounded-lg">
                    Select a file
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid lg:grid-cols-12 gap-6 items-start"
            >
              {/* Left Column: Image overview & conversion adjustments */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Uploaded Image details card */}
                <div className="glass p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-green-400 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Uploaded Image
                    </h2>
                    <button
                      onClick={resetAll}
                      className="text-white/40 hover:text-red-400 transition-colors p-1"
                      title="Upload a different image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-black rounded-xl overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={imageSrc}
                        alt="Thumbnail"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs space-y-1 min-w-0">
                      <p className="font-bold text-white truncate text-sm">
                        {originalImageFile?.name || 'My Image file'}
                      </p>
                      <p className="text-white/50 text-[11px]">
                        Original size: {originalDimensions ? `${originalDimensions.width} x ${originalDimensions.height} px` : '--'}
                      </p>
                      {optimizedDimensions && (resolutionLimit > 0) && (
                        <p className="text-green-400/80 font-medium">
                          Fitting limit: {optimizedDimensions.width} x {optimizedDimensions.height} px
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conversion options configuration */}
                <div className="glass p-5 space-y-5">
                  
                  {/* Selector Tabs */}
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
                    <button
                      onClick={() => setSettingsMode('preset')}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        settingsMode === 'preset'
                          ? 'bg-green-600/30 text-green-300 border border-green-500/30 shadow-sm'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Ready Modes
                    </button>
                    <button
                      onClick={() => setSettingsMode('custom')}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        settingsMode === 'custom'
                          ? 'bg-green-600/30 text-green-300 border border-green-500/30 shadow-sm'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Custom Settings
                    </button>
                  </div>

                  {settingsMode === 'preset' ? (
                    /* Ready Preset Grid with UI elements and logo options highlighted */
                    <div className="space-y-3">
                      <p className="text-xs text-white/50 font-normal">Select a conversion mode below:</p>
                      <div className="grid grid-cols-1 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                        {PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setActivePreset(preset.id)}
                            className={`text-left p-3.5 rounded-xl transition-all duration-200 outline-none select-none border ${
                              activePreset === preset.id
                                ? 'bg-green-950/40 border-green-500/60 text-white shadow-inner'
                                : 'border-white/5 hover:border-white/10 text-white/70 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-xs text-white">{preset.label}</span>
                              {activePreset === preset.id && (
                                <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold">Active</span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/50 leading-relaxed">{preset.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Custom Ajustment Sliders using simple, user-friendly normal wording */
                    <div className="space-y-4">
                      
                      {/* Color count slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <label className="text-white/70">Colors limit</label>
                          <span className="text-green-400 font-bold">{colorLimitSetting} colors</span>
                        </div>
                        <input
                          type="range"
                          min={2}
                          max={64}
                          step={1}
                          value={colorLimitSetting}
                          onChange={(e) => setColorLimitSetting(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                      </div>

                      {/* Detail slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <label className="text-white/70">Line accuracy level</label>
                          <span className="text-green-400 font-bold">Level {lineDetailLevel} of 5</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={lineDetailLevel}
                          onChange={(e) => setLineDetailLevel(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between text-[10px] text-white/30">
                          <span>Simple (Fast)</span>
                          <span>Highly precise</span>
                        </div>
                      </div>

                      {/* Preprocess blur radius slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <label className="text-white/70">Smooth edges blur</label>
                          <span className="text-green-400 font-bold">{smoothingSetting} pixels</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={1}
                          value={smoothingSetting}
                          onChange={(e) => setSmoothingSetting(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                      </div>

                      {/* Stroke Width outline border */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <label className="text-white/70">Border outlines thickness</label>
                          <span className="text-green-400 font-bold">{borderThickness}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5}
                          step={0.5}
                          value={borderThickness}
                          onChange={(e) => setBorderThickness(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                      </div>

                      {/* Decimal places rounding for smaller output */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <label className="text-white/70">Decimal file size reduction</label>
                          <span className="text-green-400 font-bold">{decimalPrecision} decimals</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={4}
                          step={1}
                          value={decimalPrecision}
                          onChange={(e) => setDecimalPrecision(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <span className="text-[10px] text-white/30 block">Fewer decimal numbers produce much smaller files.</span>
                      </div>

                      {/* Simple checkboxes */}
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                          <input
                            type="checkbox"
                            checked={sharpenCorners}
                            onChange={(e) => setSharpenCorners(e.target.checked)}
                            className="rounded bg-black border-white/20 text-green-600 focus:ring-0 cursor-pointer"
                          />
                          Sharpen corners
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
                          <input
                            type="checkbox"
                            checked={cleanSpecks}
                            onChange={(e) => setCleanSpecks(e.target.checked)}
                            className="rounded bg-black border-white/20 text-green-600 focus:ring-0 cursor-pointer"
                          />
                          Ignore small specks
                        </label>
                      </div>

                    </div>
                  )}

                  {/* Immediate automatic download switch */}
                  <div className="pt-4 border-t border-white/5">
                    <label className="flex items-center justify-between text-xs text-white/60 cursor-pointer select-none">
                      <span className="flex items-center gap-2">
                        <FolderDown className="w-4 h-4 text-green-400" />
                        Auto-download files immediately
                      </span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={autoDownload}
                          onChange={(e) => setAutoDownload(e.target.checked)}
                          className="sr-only peer cursor-pointer"
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600" />
                      </div>
                    </label>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={startConversion}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-6 btn-primary rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Converting image now...
                      </>
                    ) : (
                      <>
                        Convert Image now ! <ArrowRight className="w-4 h-4 text-white/80" />
                      </>
                    )}
                  </button>

                </div>
              </div>

              {/* Right Column: Visual render space and auto-updating code */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Visual Preview Block */}
                <div className="glass p-5 flex flex-col min-h-[460px]">
                  
                  {/* Results SubBar */}
                  <div className="flex justify-between items-center mb-4 text-xs font-semibold text-white/50 border-b border-white/5 pb-3">
                    <h2 className="flex items-center gap-2 text-white">
                      <Code2 className="w-4 h-4 text-green-400" />
                      Visual preview screen
                    </h2>
                    {svgResult && (
                      <div className="flex gap-3 text-[11px]">
                        <span>Vector lines: <strong className="text-white">{pathCount}</strong></span>
                        <span>File Weight: <strong className="text-white">{sizeKbVal} KB</strong></span>
                      </div>
                    )}
                  </div>

                  {/* SVG Stage */}
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl flex flex-col relative overflow-hidden min-h-[340px]">
                    {svgResult ? (
                      <div
                        className="absolute inset-0 p-6 flex items-center justify-center svg-preview-container select-all"
                        dangerouslySetInnerHTML={{ __html: svgResult }}
                      />
                    ) : isProcessing ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-4">
                        <div className="p-4 bg-green-500/5 rounded-full ring-2 ring-green-500/20">
                          <RefreshCw className="w-10 h-10 text-green-400 animate-spin" />
                        </div>
                        <p className="text-xs font-medium animate-pulse">Running precision vector calculations...</p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 p-8 text-center gap-3">
                        <div className="p-4 bg-white/5 rounded-full text-green-400/60">
                          <Maximize2 className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="max-w-xs text-xs font-medium leading-relaxed">
                          Your vectorized image will appear here. Choose a configuration style on the left and click convert.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Secondary buttons */}
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => downloadSvgFile()}
                      disabled={!svgResult}
                      className="flex-1 py-2.5 px-4 btn-secondary text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Download className="w-4 h-4 text-green-400" />
                      Download SVG file
                    </button>
                    <button
                      onClick={copyCodeToClip}
                      disabled={!svgResult}
                      className="py-2.5 px-4 btn-secondary text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-green-400" />}
                      {copied ? 'Copied code' : 'Copy code'}
                    </button>
                  </div>
                </div>

                {/* SVG Code Block: display code always */}
                <div className="glass p-5 flex flex-col rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-green-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">SVG raw code output</h3>
                      <span className="text-[9px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">Live update</span>
                    </div>
                    {svgResult && (
                      <button
                        onClick={copyCodeToClip}
                        className="flex items-center gap-1.5 text-[11px] hover:text-green-400 transition-colors text-white/50 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy raw XML code'}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    {svgResult ? (
                      <pre className="text-[10px] font-mono p-4 bg-black/60 text-slate-300 rounded-xl overflow-x-auto max-h-48 border border-white/5 select-all leading-normal whitespace-pre">
                        <code>{svgResult}</code>
                      </pre>
                    ) : (
                      <div className="py-8 text-center text-xs text-white/30 border border-dashed border-white/10 rounded-xl">
                        The raw vector SVG structure will show here after conversion.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
