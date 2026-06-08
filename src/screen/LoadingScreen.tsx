import React from "react"
import { View, Text, Image, ActivityIndicator,  } from "react-native"
import { Colors } from "../constants/colors"
import styles from "../styles/LoadingScreen.styles"

export default function LoadingScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/home_logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>AF Home</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={Colors.sky}
        style={styles.loader}
      />
    </View>
  )
}
