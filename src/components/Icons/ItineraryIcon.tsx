import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { View } from 'react-native'

type Props = {
    color?: string
    size?: number
}

export default function ItineraryIcon({ color = '#000', size = 24 }: Props) {
    const stroke = color
    const s = size
    return (
        <View style={{ width: s, height: s }}>
            <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
                <Path
                    d="M13 21H5C3.89543 21 3 20.1046 3 19V10H21V13M15 4V2M15 4V6M15 4H10.5"
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M3 10V6C3 4.89543 3.89543 4 5 4H7"
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M7 2V6"
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M21 10V6C21 4.89543 20.1046 4 19 4H18.5"
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M15.9922 19H18.9922M22 19H18.9922M18.9922 19V16M18.9922 19V22"
                    stroke={stroke}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    )
}
