import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Card, useTheme, Badge, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Node {
  type: string;
  name: string;
  scheduledTime: string;
  description?: string;
  location?: any;
}

interface DayPlan {
  dayNumber: number;
  date: string;
  nodes: Node[];
}

interface GroupInfo {
  groupName: string;
  accessCode: string;
  members: Array<{
    touristId: string;
    safetyScore?: number;
    // other fields if needed
  }>;
}

interface GroupItineraryListProps {
  days: DayPlan[];
  groupInfo?: GroupInfo | null;
}

/**
 * Renders the itinerary in a style matching the user request:
 * 1. Top Section: Group Card (Blue Background) showing Name, Code, Members
 * 2. Bottom Section: "Your Itinerary" with Day-wise blocks having a vertical blue side-border.
 */
export default function GroupItineraryList({ days, groupInfo }: GroupItineraryListProps) {
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
        case 'stay': return 'office-building'; // Hotel-like
        case 'visit': return 'camera';
        case 'transit': return 'train-car';
        case 'start': return 'flag';
        case 'end': return 'flag-checkered';
        default: return 'map-marker';
    }
  };
  
  const getLabelForType = (type: string) => {
      const t = type.toLowerCase();
      if (t === 'stay') return 'STAY';
      if (t === 'visit') return 'VISIT';
      if (t === 'transit') return 'TRANSIT';
      return type.toUpperCase();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Group Info Card */}
      {groupInfo && (
          <View style={styles.groupCard}>
             <Text style={styles.groupTitleLabel}>Group: <Text style={styles.groupTitleValue}>{groupInfo.groupName}</Text></Text>
             
             <View style={styles.codeRow}>
                 <Text style={styles.codeLabel}>Code:</Text> 
                 <Text style={styles.codeValue}>{groupInfo.accessCode}</Text>
             </View>

             <Text style={styles.memberCountLabel}>Member Count: {groupInfo.members?.length || 0}</Text>

             <View style={styles.memberList}>
                 {groupInfo.members?.map((m, idx) => {
                     // Extract ID portion if it's an object, or handle purely string IDs if not populated
                     // The API returns populated objects: { touristId: { ... } } or just the ID string if not populated
                     // But based on types, let's assume worst case handling.
                     // Actually API populate path: 'members.touristId' -> so m.touristId is an object.
                     const tid = (typeof m.touristId === 'object' && m.touristId) 
                        ? (m.touristId as any).touristId || "Unknown" 
                        : "Unknown";
                     const score = (typeof m.touristId === 'object' && m.touristId) 
                        ? (m.touristId as any).safetyScore 
                        : 0;

                     return (
                         <View key={idx} style={styles.memberItem}>
                             <MaterialCommunityIcons name="account" size={16} color="#1E3A8A" />
                             <Text style={styles.memberText}>{tid} (Score: {score ?? 100})</Text>
                         </View>
                     );
                 })}
             </View>
          </View>
      )}

      <Text style={styles.sectionHeader}>Your Itinerary</Text>

      {(!days || days.length === 0) ? (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No itinerary planned yet.</Text>
        </View>
      ) : (
        days.map((day, dIdx) => (
            <View key={dIdx} style={styles.dayContainer}>
                {/* Day Header inside the card logic */}
                <Text style={styles.dayHeader}>Day {day.dayNumber} <Text style={styles.dateText}>({formatDate(day.date)})</Text></Text>
                
                {/* Vertical Blue Line Container */}
                <View style={styles.dayContentParams}>
                    <View style={styles.blueBar} />
                    <View style={styles.nodesList}>
                        {day.nodes.map((node, nIdx) => (
                            <View key={nIdx} style={styles.nodeItem}>
                                {/* Icon Box */}
                                <View style={styles.iconBox}>
                                    {node.type.toLowerCase() === 'stay' ? (
                                        <Text style={{fontSize:20}}>🏨</Text>
                                    ) : (
                                        <MaterialCommunityIcons name={getIconForType(node.type) as any} size={24} color="#555" />
                                    )}
                                </View>
                                
                                {/* Content */}
                                <View style={styles.nodeContent}>
                                    <Text style={styles.nodeName}>{node.name}</Text>
                                    <View style={styles.nodeMetaRow}>
                                        <Text style={styles.nodeTime}>{node.scheduledTime}</Text>
                                        <Text style={styles.nodeType}>{getLabelForType(node.type)}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        ))
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#F8F9FA' // Lightest gray bg
  },
  // Header Card
  groupCard: {
      backgroundColor: '#EFF6FF', // Light blue background
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#DBEAFE'
  },
  groupTitleLabel: {
      fontSize: 16,
      color: '#1E3A8A', // Dark Blue
      fontWeight: 'bold',
      marginBottom: 8,
  },
  groupTitleValue: {
      color: '#1E40AF',
  },
  codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
  },
  codeLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
      marginRight: 6
  },
  codeValue: {
      fontSize: 14,
      color: '#4B5563'
  },
  memberCountLabel: {
      fontSize: 14,
      color: '#555',
      marginBottom: 8
  },
  memberList: {
      marginTop: 4
  },
  memberItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 6
  },
  memberText: {
      fontSize: 13,
      color: '#334155'
  },

  // Itinerary Section
  sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1E3A8A',
      marginBottom: 16
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 20
  },
  emptyText: {
      color: '#888'
  },

  // Day Card Logic
  dayContainer: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width:0, height:1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#E5E7EB'
  },
  dayHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#111',
      marginBottom: 12
  },
  dateText: {
      fontWeight: 'normal',
      color: '#6B7280',
      fontSize: 15
  },
  dayContentParams: {
      flexDirection: 'row'
  },
  blueBar: {
      width: 4,
      backgroundColor: '#3B82F6', // The vertical blue line
      borderRadius: 2,
      marginRight: 16
  },
  nodesList: {
      flex: 1
  },
  nodeItem: {
      flexDirection: 'row',
      marginBottom: 24, // Spacing between items
      alignItems: 'flex-start'
  },
  iconBox: {
      width: 40,
      alignItems: 'center',
      marginRight: 12
  },
  nodeContent: {
      flex: 1,
      paddingTop: 0
  },
  nodeName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 4
  },
  nodeMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
  },
  nodeTime: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#9CA3AF',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4
  },
  nodeType: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '500'
  }
});
