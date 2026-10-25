import React from 'react';
import { View, Image, Text, useWindowDimensions } from 'react-native';

export const ART_W = 512;
export const ART_H = 1088;

// Slot rectangles (art units) shared by the normal and boss gameplay screens.
export const GAMEPLAY_RECTS = {
  quit:      { x: 18,  y: 18,  w: 80, h: 80 }, // round pause button (buttonPause2.png is ~1:1)
  coin:      { x: 326, y: 0,   w: 186, h: 300 }, // board + patience meter (one PNG)
  customer:  { x: 20,   y: 141, w: 230, h: 250 }, // bottom (386) = counter top edge (384)
  word:      { x: 30,  y: 380, w: 452, h: 100 },
  hint:      { x: 252, y: 302, w: 244, h: 76  }, // customer speech bubble
  serve:     { x: 175, y: 460, w: 161, h: 84  },
  chef:      { x: 330, y: 480, w: 200, h: 200 },
  conveyors: { x: 0,   y: 665, w: 512, h: 328 }, 
  belt0:     { x: 0,   y: 663, w: 512, h: 94  },
  belt1:     { x: 0,   y: 777, w: 512, h: 94  },
  belt2:     { x: 0,   y: 885, w: 512, h: 94  },
};

export const PATIENCE_METER_BOX = { left: '29.63%', top: '38.67%', width: '48.15%', height: '57.33%' };

const DEBUG = true; // set to false when everything is placed

export function useStage() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / ART_W, height / ART_H);
  return {
    scale,
    scaleX: scale,
    scaleY: scale,
    w: ART_W * scale,
    h: ART_H * scale,
  };
}

export const Slot = ({ rect, scale, scaleX, scaleY, style, children }) => {
  const stage = useStage();
  const sx = scaleX ?? stage.scaleX;
  const sy = scaleY ?? stage.scaleY;
  return (
    <View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          left: rect.x * sx,
          top: rect.y * sy,
          width: rect.w * sx,
          height: rect.h * sy,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const Grid = ({ scale }) => (
  <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
    {Array.from({ length: Math.floor(ART_H / 50) + 1 }, (_, i) => i * 50).map((y) => (
      <View key={`y${y}`} style={{
        position: 'absolute', top: y * scale, left: 0, right: 0, height: 1,
        backgroundColor: y % 100 === 0 ? 'rgba(0,255,255,0.8)' : 'rgba(0,255,255,0.3)',
      }}>
        {y % 100 === 0 && <Text style={{ color: '#0ff', fontSize: 10 }}>{y}</Text>}
      </View>
    ))}
    {Array.from({ length: Math.floor(ART_W / 50) + 1 }, (_, i) => i * 50).map((x) => (
      <View key={`x${x}`} style={{
        position: 'absolute', left: x * scale, top: 0, bottom: 0, width: 1,
        backgroundColor: x % 100 === 0 ? 'rgba(255,255,0,0.8)' : 'rgba(255,255,0,0.3)',
      }}>
        {x % 100 === 0 && <Text style={{ color: '#ff0', fontSize: 10 }}>{x}</Text>}
      </View>
    ))}
  </View>
);

export const Stage = ({ source, w, h, children }) => (
  <View style={{ width: w, height: h }}>
    <Image source={source} style={{ position: 'absolute', width: w, height: h }} resizeMode="stretch" />
    {children}
  </View>
);