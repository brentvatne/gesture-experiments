import React from 'react';
import {
  Animated,
  Image,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Camera } from 'expo';
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

const HEADER_HEIGHT = 80;
const WINDOW_HEIGHT = Dimensions.get('window').height;

const stateToPropMappings = {
  [State.BEGAN]: 'onBegan',
  [State.FAILED]: 'onFailed',
  [State.CANCELLED]: 'onCancelled',
  [State.ACTIVE]: 'onActivated',
  [State.END]: 'onEnded',
};

// When scroll offset is 0, moving your finger down will drag the header and scrollview up at the same time
// When the scroll offset is > 0, ignore the pan gesture

export default class App extends React.Component {
  constructor() {
    super();

    const panY = new Animated.Value(0);
    const scrollY = new Animated.Value(-HEADER_HEIGHT);

    this._onPanGestureEvent = Animated.event(
      [{ nativeEvent: { translationY: panY } }],
      { useNativeDriver: true }
    );

    this._onScrollEvent = Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    );

    this.state = {
      items: getItems(),
      scrollY,
      modalIsAnimating: false,
      scrollWaitsForPan: true,
      panY,
      modalIsHidden: false,
    };
  }

  _updateScrollState = e => {
    if (e.nativeEvent.targetContentOffset.y === -HEADER_HEIGHT) {
      this.setState({ scrollWaitsForPan: true });
    } else {
      this.setState({ scrollWaitsForPan: false });
    }
  };

  _handlePanStateChange = e => {
    const { oldState, state } = e.nativeEvent;

    if (oldState === State.ACTIVE && state === State.END) {
      this._handleReleasePan(e);
    }
  };

  _handleReleasePan = e => {
    const { oldState, state, translationY, velocityY } = e.nativeEvent;
    const { modalIsHidden } = this.state;

    let toValue;

    this._scrollView.getNode().scrollTo({ y: -HEADER_HEIGHT });
    if (modalIsHidden) {
      if (translationY < -WINDOW_HEIGHT / 3 || velocityY < -3000) {
        toValue = 0;
      } else {
        toValue = WINDOW_HEIGHT;
      }
    } else {
      if (translationY > WINDOW_HEIGHT / 3 || velocityY > 600) {
        toValue = WINDOW_HEIGHT;
      } else {
        toValue = 0;
      }
    }

    this.state.panY.flattenOffset();

    requestAnimationFrame(() => {
      this.setState({ modalIsAnimating: true });
    });
    Animated.spring(this.state.panY, {
      toValue,
      stiffness: 3000,
      damping: 500,
      mass: 3,
      useNativeDriver: this.state.panY.__isNative,
    }).start(({ finished }) => {
      this.setState({ modalIsAnimating: false });
      if (finished) {
        this.state.panY.extractOffset();
        let modalIsHidden = toValue !== 0;
        this.setState({ modalIsHidden });
      }
    });
  };

  render() {
    const animatedIf = (cond, a, b) => {
      return Animated.add(Animated.multiply(cond, a), Animated.add(!cond, b));
    };
    const headerTranslateY = this.state.scrollY.interpolate({
      inputRange: [-HEADER_HEIGHT, 0],
      outputRange: [0, -HEADER_HEIGHT],
      extrapolate: 'clamp',
    });

    let panTranslateY = this.state.panY.interpolate({
      inputRange: [0, WINDOW_HEIGHT],
      outputRange: [0, WINDOW_HEIGHT],
      extrapolate: 'clamp',
    });

    let panProps = {
      maxDeltaY: 30,
      minDeltaY: 5000, // gesture props not being properly updated, need to workaround like this
      minOffsetY: 1,
    };

    if (this.state.modalIsHidden) {
      panProps = {
        minDeltaY: 5,
      };
    }

    return (
      <View style={styles.container}>
        <Camera style={StyleSheet.absoluteFill} />
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: '#fff',
            transform: [{ translateY: panTranslateY }],
          }}>
          <PanGestureHandler
            id="pan"
            waitFor={this.state.scrollWaitsForPan ? '' : 'scroll'}
            {...panProps}
            enabled={!this.state.modalIsAnimating}
            onGestureEvent={this._onPanGestureEvent}
            onHandlerStateChange={this._handlePanStateChange}>
            <Animated.View style={{ flex: 1 }}>
              {this.state.modalIsHidden ? (
                <View
                  style={{
                    height: 200,
                    position: 'absolute',
                    top: -200,
                    left: 0,
                    right: 0,
                  }}
                />
              ) : null}
              <AnimatedScrollView
                id="scroll"
                ref={view => {
                  this._scrollView = view;
                }}
                contentInset={{ top: HEADER_HEIGHT }}
                contentOffset={{ y: -HEADER_HEIGHT }}
                waitFor={this.state.scrollWaitsForPan ? 'pan' : ''}
                onScrollEndDrag={this._updateScrollState}
                onScroll={this._onScrollEvent}
                scrollEventThrottle={1}
                style={{ height: WINDOW_HEIGHT }}>
                <View>{this.state.items}</View>
              </AnimatedScrollView>
            </Animated.View>
          </PanGestureHandler>
          <View
            style={{
              height: HEADER_HEIGHT,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}>
            <PanGestureHandler
              minDeltaY={10}
              enabled={!this.state.modalIsAnimating}
              onHandlerStateChange={this._handlePanStateChange}
              shouldCancelWhenOutside={false}
              onGestureEvent={this._onPanGestureEvent}>
              <Animated.View
                style={{
                  height: HEADER_HEIGHT,
                  justifyContent: 'center',
                  paddingTop: 30,
                  backgroundColor: 'red',
                  transform: [{ translateY: headerTranslateY }],
                }}>
                <Text
                  style={{ fontSize: 18, color: '#fff', textAlign: 'center' }}>
                  Hello there
                </Text>
              </Animated.View>
            </PanGestureHandler>
          </View>
        </Animated.View>

        <StatusBar barStyle="light-content" />
      </View>
    );
  }
}

const noop = () => {};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
