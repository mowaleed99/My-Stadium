import React from 'react';

interface PitchVisualizerProps {
  fieldName: string;
  selectedSlot: string | null;
  isBooked: boolean;
}

export const PitchVisualizer: React.FC<PitchVisualizerProps> = ({
  fieldName,
  selectedSlot,
  isBooked,
}) => {
  return (
    <div id="pitch-visualizer-container" className="relative w-full aspect-[16/10] max-w-md mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-[#0e1c14] to-[#040806] border border-emerald-900/40 p-3 shadow-inner">
      {/* Background Grass Pattern Glimmer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)]" />
      
      {/* Outer pitch boundary */}
      <div className="absolute inset-4 rounded-lg border border-emerald-500/30 flex flex-col justify-between items-center relative overflow-hidden h-[calc(100%-2rem)]">
        {/* Draw vertical stripes on grass */}
        <div className="absolute inset-0 flex">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full ${
                i % 2 === 0 ? 'bg-emerald-950/20' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Center line */}
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-emerald-500/30 -translate-y-1/2" />
        
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full border border-emerald-500/30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
        </div>

        {/* Home penalty box */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-10 border-b border-x border-emerald-500/30 rounded-b-md">
          {/* Goal post line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-2 border-b border-x border-emerald-400/60 bg-emerald-950/50" />
          {/* Penalty spot */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
        </div>

        {/* Away penalty box */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-10 border-t border-x border-emerald-500/30 rounded-t-md">
          {/* Goal post line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-2 border-t border-x border-emerald-400/60 bg-emerald-950/50" />
          {/* Penalty spot */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
        </div>

        {/* Corner arcs */}
        <div className="absolute top-0 left-0 w-3 h-3 border-r border-b border-emerald-500/30 rounded-br-full" />
        <div className="absolute top-0 right-0 w-3 h-3 border-l border-b border-emerald-500/30 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-r border-t border-emerald-500/30 rounded-tr-full" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-l border-t border-emerald-500/30 rounded-tl-full" />

        {/* Interactive Overlays on Turf showing Player Spots */}
        {selectedSlot ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-2 text-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-[#0b1610] border border-emerald-500/30 rounded-xl px-4 py-2 max-w-[85%] shadow-xl">
              <span className="text-[10px] text-emerald-400 font-sans tracking-wider block font-bold uppercase">
                {fieldName}
              </span>
              <p className="text-xs font-bold text-white mt-1">{selectedSlot}</p>
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isBooked
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-[#10b981] animate-pulse'
                  }`}
                />
                <span className={`text-[10px] font-bold ${isBooked ? 'text-rose-400' : 'text-[#10b981]'}`}>
                  {isBooked ? 'الحجز غير متاح (محجوز)' : 'الوقت متاح للحجز فوري'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-2 text-center">
            <div className="bg-[#060a08]/90 border border-emerald-900/60 rounded-xl px-4 py-2.5 max-w-[80%] backdrop-blur-md">
              <p className="text-[10.5px] text-emerald-400 font-semibold tracking-wide">
                الرجاء اختيار اليوم ووقت الحجز
              </p>
              <p className="text-[9px] text-[#4ade80]/60 mt-1">
                اضغط على الأوقات بالأسفل لعرض تفاصيل جاهزية الملعب
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Decorative Light Glows coming from the top corners */}
      <div className="absolute top-0 left-0 w-16 h-16 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
    </div>
  );
};
