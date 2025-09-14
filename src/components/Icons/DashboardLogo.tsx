import * as React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import { View } from 'react-native'

type Props = {
  color?: string
  size?: number
}

export default function DashboardLogo({ color = '#000', size = 24 }: Props) {
  const stroke = color
  const s = size
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* Outer rounded square */}
        <Rect x="2" y="2" width="20" height="20" rx="3" stroke={stroke} strokeWidth={1.5} />
        {/* Home/house icon centered inside the square */}
        {/* Roof */}
        <Path d="M12 6.5l6 5V18a1 1 0 0 1-1 1h-3v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4H7a1 1 0 0 1-1-1v-6.5l6-5z" fill={stroke} />
        {/* Door (cutout) - slightly darker stroke by using white fill to simulate inset if background is white */}
        <Path d="M10.5 13.5h3v4h-3z" fill="#FFFFFF" opacity={0.0} />
      </Svg>
    </View>
  )
}
