import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Modal, FlatList} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  flex?: number;
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default function DatePickerInput({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  flex,
}: Props) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const formatDate = (date: Date | null) => {
    if (!date) {
      return placeholder;
    }
    return `${String(date.getDate()).padStart(2, '0')}/${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const days = Array.from({length: 31}, (_, i) => i + 1);
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() + i);

  const handleConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  return (
    <View
      style={
        flex !== undefined ? {flex, marginBottom: 16} : {marginBottom: 16}
      }>
      <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => {
          setTempDate(value || new Date());
          setShow(true);
        }}
        className="bg-white border border-slate-200 rounded-xl h-12 px-4 flex-row items-center"
        activeOpacity={0.7}>
        <Icon name="calendar-outline" size={20} color="#64748B" />
        <Text
          className={`flex-1 ml-2 text-base ${
            value ? 'text-slate-900' : 'text-slate-400'
          }`}>
          {formatDate(value)}
        </Text>
        <Icon name="chevron-down" size={18} color="#94A3B8" />
      </TouchableOpacity>

      <Modal visible={show} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-4 pt-3 pb-8">
            <View className="w-10 h-1 bg-slate-300 rounded-full self-center mb-4" />
            <Text className="text-lg font-bold text-center mb-4">
              Select Date
            </Text>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs text-slate-500 mb-1 text-center">
                  Day
                </Text>
                <FlatList
                  data={days}
                  style={{height: 200}}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      onPress={() => {
                        const d = new Date(tempDate);
                        d.setDate(item);
                        setTempDate(d);
                      }}
                      className={`py-3 items-center ${
                        tempDate.getDate() === item ? 'bg-blue-50' : ''
                      }`}>
                      <Text
                        className={
                          tempDate.getDate() === item
                            ? 'text-[#192433] font-bold'
                            : 'text-slate-700'
                        }>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item.toString()}
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs text-slate-500 mb-1 text-center">
                  Month
                </Text>
                <FlatList
                  data={MONTHS}
                  style={{height: 200}}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item, index}) => (
                    <TouchableOpacity
                      onPress={() => {
                        const d = new Date(tempDate);
                        d.setMonth(index);
                        setTempDate(d);
                      }}
                      className={`py-3 items-center ${
                        tempDate.getMonth() === index ? 'bg-blue-50' : ''
                      }`}>
                      <Text
                        className={
                          tempDate.getMonth() === index
                            ? 'text-[#192433] font-bold'
                            : 'text-slate-700'
                        }>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item}
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs text-slate-500 mb-1 text-center">
                  Year
                </Text>
                <FlatList
                  data={years}
                  style={{height: 200}}
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      onPress={() => {
                        const d = new Date(tempDate);
                        d.setFullYear(item);
                        setTempDate(d);
                      }}
                      className={`py-3 items-center ${
                        tempDate.getFullYear() === item ? 'bg-blue-50' : ''
                      }`}>
                      <Text
                        className={
                          tempDate.getFullYear() === item
                            ? 'text-[#192433] font-bold'
                            : 'text-slate-700'
                        }>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item.toString()}
                />
              </View>
            </View>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => setShow(false)}
                className="flex-1 bg-slate-100 rounded-xl h-12 items-center justify-center">
                <Text className="text-slate-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                className="flex-1 bg-slate-100 rounded-xl h-12 items-center justify-center">
                <Text className="text-slate-700 font-semibold">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
