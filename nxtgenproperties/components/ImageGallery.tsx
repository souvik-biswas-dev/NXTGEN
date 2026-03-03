import React, { useState } from 'react';
import { View, Image, Modal, FlatList, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageGalleryProps {
  images: string[];
}

const { width, height } = Dimensions.get('window');

export const ImageGallery: React.FC<ImageGalleryProps> = React.memo(({ images }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setModalVisible(true);
  };

  return (
    <View>
      {/* Thumbnail Preview */}
      <TouchableOpacity onPress={() => openGallery(0)}>
        <Image
          source={{ uri: images[0] || 'https://via.placeholder.com/400x300' }}
          className="w-full h-80"
          resizeMode="cover"
        />
        {images.length > 1 && (
          <View className="absolute bottom-3 right-3 bg-black/70 rounded-lg px-3 py-1.5">
            <Text className="text-white text-sm font-medium">
              +{images.length - 1} more
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Full Screen Modal */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black">
          {/* Header */}
          <View className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4 pt-12">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-lg font-medium">
                {currentIndex + 1} / {images.length}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={32} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Carousel */}
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentIndex(index);
            }}
            initialScrollIndex={currentIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={{ width, height }}>
                <Image
                  source={{ uri: item }}
                  style={{ width, height }}
                  resizeMode="contain"
                />
              </View>
            )}
            keyExtractor={(item, index) => `${item}-${index}`}
          />
        </View>
      </Modal>
    </View>
  );
});
