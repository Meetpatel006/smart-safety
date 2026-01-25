import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RightActionButtonsProps {
    onCompassPress?: () => void;
    onDangerFlagPress?: () => void;
    onLayersPress?: () => void;
    onSOSPress?: () => void;
}

export default function RightActionButtons({
    onCompassPress,
    onDangerFlagPress,
    onLayersPress,
    onSOSPress,
}: RightActionButtonsProps) {
    return (
        <View style={styles.container}>
            {/* Compass / Navigation Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={onCompassPress}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="navigation" size={22} color="#374151" />
            </TouchableOpacity>

            {/* Danger Flag / Report Button */}
            <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={onDangerFlagPress}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="flag" size={22} color="#EF4444" />
            </TouchableOpacity>

            {/* Layers Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={onLayersPress}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="layers-outline" size={22} color="#6366F1" />
            </TouchableOpacity>

            {/* SOS Button - Opens Bottom Sheet */}
            <TouchableOpacity
                style={[styles.button, styles.sosButton]}
                onPress={onSOSPress}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="shield-alert" size={22} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 16,
        bottom: 110,
        zIndex: 90,
        gap: 10,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dangerButton: {
        backgroundColor: '#FEF2F2',
    },
    sosButton: {
        backgroundColor: '#EF4444',
    },
});
