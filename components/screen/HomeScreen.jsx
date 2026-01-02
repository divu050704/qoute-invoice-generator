import React, { useState, useRef } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import HomeTab from "./tabs/HomeTab";
import RecordTab from "./tabs/RecordTab";
import SettingTab from "./tabs/SettingTab";
import { View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import { Home, FileText, Settings } from "lucide-react-native";
import Colors from "../colors";

function HandleIconByName(name, size = 24, index) {
  if (name === "Home")
    return (
      <Home
        size={size}
        color={index === 0 ? Colors.accentGreen : "black"}
      />
    );
  if (name === "Records")
    return (
      <FileText
        size={size}
        color={index === 1 ? Colors.accentGreen : "black"}
      />
    );
  if (name === "Settings")
    return (
      <Settings
        size={size}
        color={index === 2 ? Colors.accentGreen : "black"}
      />
    );
  return <Home size={size} />;
}

function TabBar({ state, descriptors, navigation, position }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const routesCount = state.routes.length;
  const indicatorWidth = containerWidth / Math.max(1, routesCount);
  const animatedPosition = position || new Animated.Value(state.index);

  const inputRange = state.routes.map((_, i) => i);

  return (
    <View
      style={{
        backgroundColor: "white",
      }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 2,
            width: indicatorWidth,
            backgroundColor: Colors.accentGreen,
            transform: [
              {
                translateX: animatedPosition.interpolate({
                  inputRange,
                  outputRange: inputRange.map((i) => i * indicatorWidth),
                  extrapolate: "clamp",
                }),
              },
            ],
          }}
        />
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          // opacity animation for icon/text while swiping
          const opacity = animatedPosition.interpolate({
            inputRange: inputRange.map((i) => i),
            outputRange: inputRange.map((i) => (i === index ? 1 : 0.6)),
            extrapolate: "clamp",
          });

          return (
            <TouchableOpacity
              key={label + index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                alignItems: "center",
                paddingVertical: 10,
                flex: 1,
              }}
            >
              <Animated.View style={{ opacity }}>
                {HandleIconByName(label, 22, state.index) /* icon */}
              </Animated.View>

              <Animated.Text
                style={{
                  color: isFocused ? Colors.accentGreen : "black",
                  fontFamily: "Poppins_Regular",
                  fontSize: 10,
                  marginTop: 2,
                  opacity,
                }}
              >
                {label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const Tab = createMaterialTopTabNavigator();
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ swipeEnabled: true }}
    >
      <Tab.Screen name="Home" component={HomeTab} />
      <Tab.Screen name="Records" component={RecordTab} />
      <Tab.Screen name="Settings" component={SettingTab} />
    </Tab.Navigator>
  );
}