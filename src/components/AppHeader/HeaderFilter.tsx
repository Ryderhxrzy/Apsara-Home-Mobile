import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface HeaderFilterProps {
  onFilterChange?: (filterType: string, value: any) => void;
  showRoomFilter?: boolean;
  selectedRoom?: string;
}

const SORT_OPTIONS = ['Relevant', 'A-Z', 'Z-A', 'Price: Low', 'Price: High', 'Newest'];
const PRICE_OPTIONS = ['All', 'Under ₱5k', '₱5k-₱20k', '₱20k-₱50k', 'Over ₱50k'];
const ROOM_OPTIONS = [
  { id: 0, name: 'All Room Types' },
  { id: 1, name: 'Bedroom' },
  { id: 2, name: 'Kitchen' },
  { id: 3, name: 'Living Room' },
  { id: 4, name: 'Outdoor' },
  { id: 5, name: 'Study & Office' },
  { id: 6, name: 'Dining Room' },
  { id: 7, name: 'Laundry Room' },
  { id: 8, name: 'Bathroom' },
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

export default function HeaderFilter({ onFilterChange, showRoomFilter = false, selectedRoom = 'Bedroom' }: HeaderFilterProps) {
  const [activeSort, setActiveSort] = useState('Relevant');
  const [activePrice, setActivePrice] = useState('All');
  const [activeRoom, setActiveRoom] = useState(selectedRoom);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const modalTranslateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(modalTranslateY, {
            toValue: MODAL_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setExpandedFilter(null));
        } else {
          Animated.spring(modalTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (expandedFilter === 'room') {
      modalTranslateY.setValue(0);
    }
  }, [expandedFilter, modalTranslateY]);

  useEffect(() => {
    setActiveRoom(selectedRoom);
  }, [selectedRoom]);

  const handleSort = (sort: string) => {
    setActiveSort(sort);
    setExpandedFilter(null);
    onFilterChange?.('sort', sort);
  };

  const handlePrice = (price: string) => {
    setActivePrice(price);
    setExpandedFilter(null);
    onFilterChange?.('price', price);
  };

  const handleRoom = (room: string) => {
    setActiveRoom(room);
    setExpandedFilter(null);
    onFilterChange?.('room', room);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Room Type - Always visible when in ShopByRoomScreen */}
        {showRoomFilter && (
          <View style={styles.filterItem}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                (expandedFilter === 'room' || activeRoom !== 'Bedroom') && styles.filterButtonActive,
              ]}
              onPress={() => setExpandedFilter(expandedFilter === 'room' ? null : 'room')}
            >
              <Ionicons name="home-outline" size={14} color={Colors.text} />
              <Text style={styles.filterText} numberOfLines={1}>{activeRoom}</Text>
              <Ionicons
                name={expandedFilter === 'room' ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={Colors.text}
              />
            </TouchableOpacity>

            <Modal
              visible={expandedFilter === 'room'}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setExpandedFilter(null)}
            >
              <View style={styles.modalContainer}>
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setExpandedFilter(null)}
                />
                <Animated.View
                  style={[
                    styles.roomFilterModal,
                    {
                      transform: [{ translateY: modalTranslateY }],
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <View style={styles.roomFilterHandleContainer}>
                    <View style={styles.roomFilterHandle} />
                  </View>
                  <View style={styles.roomFilterHeader}>
                    <Text style={styles.roomFilterTitle}>Room Type</Text>
                    <TouchableOpacity onPress={() => setExpandedFilter(null)}>
                      <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    style={styles.roomFilterList}
                    showsVerticalScrollIndicator={false}
                  >
                    {ROOM_OPTIONS.map((room, index) => (
                      <TouchableOpacity
                        key={room.id}
                        style={[
                          styles.roomFilterItem,
                          index === ROOM_OPTIONS.length - 1 && styles.roomFilterItemLast,
                          activeRoom === room.name && styles.roomFilterItemActive,
                        ]}
                        onPress={() => {
                          handleRoom(room.name);
                          setExpandedFilter(null);
                        }}
                      >
                        <View style={styles.roomFilterItemContent}>
                          <Text
                            style={[
                              styles.roomFilterItemText,
                              activeRoom === room.name && styles.roomFilterItemTextActive,
                            ]}
                          >
                            {room.name}
                          </Text>
                        </View>
                        {activeRoom === room.name && (
                          <View style={styles.roomFilterCheckmark}>
                            <Ionicons name="checkmark" size={20} color={Colors.sky} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              </View>
            </Modal>
          </View>
        )}

        {/* Sort */}
        <View style={styles.filterItem}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              expandedFilter === 'sort' && styles.filterButtonActive,
            ]}
            onPress={() => setExpandedFilter(expandedFilter === 'sort' ? null : 'sort')}
          >
            <Ionicons name="swap-vertical" size={14} color={Colors.text} />
            <Text style={styles.filterText}>{activeSort}</Text>
            <Ionicons
              name={expandedFilter === 'sort' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={Colors.text}
            />
          </TouchableOpacity>

          {expandedFilter === 'sort' && (
            <View style={styles.dropdown}>
              {SORT_OPTIONS.map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.dropdownItem,
                    activeSort === sort && styles.dropdownItemActive,
                  ]}
                  onPress={() => handleSort(sort)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      activeSort === sort && styles.dropdownTextActive,
                    ]}
                  >
                    {sort}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.filterItem}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              expandedFilter === 'price' && styles.filterButtonActive,
            ]}
            onPress={() => setExpandedFilter(expandedFilter === 'price' ? null : 'price')}
          >
            <Ionicons name="pricetag-outline" size={14} color={Colors.text} />
            <Text style={styles.filterText}>{activePrice}</Text>
            <Ionicons
              name={expandedFilter === 'price' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={Colors.text}
            />
          </TouchableOpacity>

          {expandedFilter === 'price' && (
            <View style={styles.dropdown}>
              {PRICE_OPTIONS.map((price) => (
                <TouchableOpacity
                  key={price}
                  style={[
                    styles.dropdownItem,
                    activePrice === price && styles.dropdownItemActive,
                  ]}
                  onPress={() => handlePrice(price)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      activePrice === price && styles.dropdownTextActive,
                    ]}
                  >
                    {price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterItem: {
    position: 'relative',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: Colors.sky,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    maxWidth: 120,
  },
  dropdown: {
    position: 'absolute',
    top: 42,
    left: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 140,
    maxHeight: 320,
    zIndex: 1000,
  },
  dropdownWide: {
    minWidth: 180,
    maxHeight: 400,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  dropdownTextActive: {
    color: Colors.sky,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalOverlay: {
    flex: 1,
  },
  roomFilterModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 20,
  },
  roomFilterHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  roomFilterHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  roomFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  roomFilterTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  roomFilterList: {
    paddingHorizontal: 0,
  },
  roomFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  roomFilterItemLast: {
    borderBottomWidth: 0,
  },
  roomFilterItemActive: {
    backgroundColor: '#eff6ff',
  },
  roomFilterItemContent: {
    flex: 1,
  },
  roomFilterItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  roomFilterItemTextActive: {
    fontWeight: '700',
    color: Colors.sky,
  },
  roomFilterCheckmark: {
    marginLeft: 12,
  },
});
