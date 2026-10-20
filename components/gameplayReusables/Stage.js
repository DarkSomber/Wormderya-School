import React from 'react';
import { View, Image, Text, useWindowDimensions } from 'react-native';

export const ART_W = 512;
export const ART_H = 1088;

const DEBUG = true; // set to false when everything is placed

export function useStage() {
  const { width, height } = useWindowDimensions();
  const scaleX = width / ART_W;
  const scaleY = height / ART_H;
  return {
    scale: scaleX,        // kept so existing code using `scale` still works
    scaleX,
    scaleY,
    w: width,
    h: height,
  };
}

export const Slot = ({ rect, scale, scaleX, scaleY, style, children }) => {
  const sx = scaleX ?? scale;
  const sy = scaleY ?? scale;
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