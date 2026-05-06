import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { PRIMARY } from '../constants/colors';

export default function CalendarModal({
  isDark, 
  visible, 
  onClose, 
  onDateSelect, 
  selectedDate 
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlayCenter}>
        <View style={styles.calendarContainer}>
            <Calendar
              enableSwipeMonths={true}
              onDayPress={onDateSelect}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: PRIMARY }
              }}
              theme={{
                backgroundColor: isDark ? '#1E1E1E' : '#FFF',
                calendarBackground: isDark ? '#1E1E1E' : '#FFF',
                dayTextColor: isDark ? '#F5F5F5' : '#2d4150',
                monthTextColor: isDark ? '#F5F5F5' : '#2d4150',
                textSectionTitleColor: isDark ? '#A1A1AA' : '#b6c1cd',
                textDisabledColor: isDark ? '#6B7280' : '#d9e1e8',
                todayTextColor: PRIMARY,
                arrowColor: PRIMARY,
                selectedDayBackgroundColor: PRIMARY,
              }}
            />
          <TouchableOpacity style={styles.calendarCloseBtn} onPress={onClose}>
            <Text style={{ color: '#64748B', fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  calendarCloseBtn: {
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
