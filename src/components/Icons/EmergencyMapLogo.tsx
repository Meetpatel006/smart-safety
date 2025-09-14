import * as React from 'react'
import Svg, { Path, Polygon, G, Circle } from 'react-native-svg'
import { View } from 'react-native'

type Props = {
  color?: string
  size?: number
}

export default function EmergencyMapLogo({ color = '#000', size = 24 }: Props) {
  const stroke = color
  const s = size
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {/* stylized folded map */}
        <G stroke={stroke} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 6l5-2 4 1 6-1v13l-5 2-4-1-6 1V6z" fill="none" />
          {/* fold lines */}
          <Path d="M8 4v15" opacity={0.7} />
          <Path d="M15 3.5v15" opacity={0.6} />
        </G>

        {/* location pin */}
        <G>
          <Path
            d="M12 9.5c1.3807 0 2.5 1.1193 2.5 2.5 0 2.5-2.5 5.5-2.5 5.5s-2.5-3-2.5-5.5c0-1.3807 1.1193-2.5 2.5-2.5z"
            fill={stroke}
          />
          <Circle cx="12" cy="12" r="0.8" fill="#fff" />
        </G>
      </Svg>
    </View>
  )
}
