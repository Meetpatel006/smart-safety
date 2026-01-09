import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { View } from 'react-native'

type Props = {
  color?: string
  size?: number
  filled?: boolean
}

export default function DashboardLogo({ color = '#000', size = 24, filled = false }: Props) {
  const stroke = color
  const s = size
  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17 21H7C4.79086 21 3 19.2091 3 17V10.7076C3 9.30887 3.73061 8.01175 4.92679 7.28679L9.92679 4.25649C11.2011 3.48421 12.7989 3.48421 14.0732 4.25649L19.0732 7.28679C20.2694 8.01175 21 9.30887 21 10.7076V17C21 19.2091 19.2091 21 17 21Z"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={filled ? color : 'none'}
        />
        <Path
          d="M9 17H15"
          stroke={filled ? '#fff' : stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}
