import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { View } from 'react-native'

type Props = {
  color?: string
  size?: number
  filled?: boolean
}

export default function EmergencyMapLogo({ color = '#000', size = 24, filled = false }: Props) {
  const stroke = color
  const s = size
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4.03132 8.91684L19.508 4.58337C19.8835 4.47824 20.2294 4.82421 20.1243 5.19967L15.7908 20.6763C15.6642 21.1284 15.0407 21.1726 14.8517 20.7429L11.6034 13.3605C11.5531 13.246 11.4616 13.1546 11.3471 13.1042L3.96477 9.85598C3.53507 9.66692 3.57926 9.04342 4.03132 8.91684Z"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={filled ? color : 'none'}
        />
      </Svg>
    </View>
  )
}
