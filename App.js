import React from 'react';
import {
  Animated,
  Image,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  PanGestureHandler,
  ScrollView,
  State,
} from 'react-native-gesture-handler';

const { createAnimatedComponent } = Animated;
const AnimatedScrollView = createAnimatedComponent(ScrollView);

const getItems = (
  n = 20,
  width = Dimensions.get('window').width,
  height = 200
) => {
  return Array.apply(null, Array(n))
    .map((v, i) => `http://placehold.it/${width}x${height}?text=${i + 1}`)
    .map((src, i) => (
      <Image
        key={i.toString()}
        source={{ uri: src }}
        style={{ width, height }}
      />
    ));
};

const stateToPropMappings = {
  [State.BEGAN]: 'onBegan',
  [State.FAILED]: 'onFailed',
  [State.CANCELLED]: 'onCancelled',
  [State.ACTIVE]: 'onActivated',
  [State.END]: 'onEnded',
};

const HEADER_HEIGHT = 60;
const WINDOW_HEIGHT = Dimensions.get('window').height;

// When scroll offset is 0, moving your finger down will drag the header and scrollview up at the same time
// When the scroll offset is > 0, ignore the pan gesture

export default class App extends React.Component {
  constructor() {
    super();

    const panY = new Animated.Value(0);
    const scrollY = new Animated.Value(-HEADER_HEIGHT);

    scrollY.addListener(({ value }) => console.log(value));

    // panY.addListener(({ value }) => console.log(value));
    // scrollY.addListener(({ value }) => console.log(value));

    this._onPanGestureEvent = Animated.event(
      [{ nativeEvent: { translationY: panY } }],
      { useNativeDriver: true }
    );

    this._onScrollEvent = Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    );

    this.state = { items: getItems(), panY, scrollY, scrollWaitsForPan: true };
  }

  _updateScrollState = e => {
    if (e.nativeEvent.targetContentOffset.y === 0) {
      this.setState({ scrollWaitsForPan: true });
    } else {
      this.setState({ scrollWaitsForPan: false });
    }
  };

  _handlePanStateChange = e => {
    const { oldState, state } = e.nativeEvent;
  };

  render() {
    const headerTranslateY = this.state.scrollY.interpolate({
      inputRange: [-HEADER_HEIGHT, 0],
      outputRange: [0, -HEADER_HEIGHT],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.container}>
        <PanGestureHandler
          id="pan"
          waitFor="outer-pan"
          maxDeltaY={30}
          minOffsetY={1}
          onGestureEvent={this._onPanGestureEvent}
          onHandlerStateChange={this._handlePanStateChange}>
          <AnimatedScrollView
            id="scroll"
            contentInset={{ top: HEADER_HEIGHT }}
            contentOffset={{ y: -HEADER_HEIGHT }}
            waitFor={this.state.scrollWaitsForPan ? 'pan' : ''}
            onScrollEndDrag={this._updateScrollState}
            onScroll={this._onScrollEvent}
            scrollEventThrottle={1}
            style={{ height: WINDOW_HEIGHT }}>
            <View>{this.state.items}</View>
          </AnimatedScrollView>
        </PanGestureHandler>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: HEADER_HEIGHT,
            paddingTop: 30,
            backgroundColor: 'red',
            transform: [{ translateY: headerTranslateY }],
          }}>
          <Text style={{ fontSize: 18, color: '#fff', textAlign: 'center' }}>
            Hello there
          </Text>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
