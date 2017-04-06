/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {
    Component
}                     from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    ListView,
    View,
    AsyncStorage,
    Button,
    DeviceEventEmitter
}                     from 'react-native';
import Beacons        from 'react-native-beacons-android';

import Storage from 'react-native-storage';

var PushNotification = require('react-native-push-notification');

var STORAGE_KEY = '@AsyncStorageExample:key';

/* Config Stoarage */
var storage = new Storage({
    // maximum capacity, default 1000
    size: 1000,

    // Use AsyncStorage for RN, or window.localStorage for web.
    // If not set, data would be lost after reload.
    storageBackend: AsyncStorage,

    // expire time, default 1 day(1000 * 3600 * 24 milliseconds).
    // can be null, which means never expire.
    defaultExpires: null,

    // cache data in the memory. default is true.
    enableCache: true,

    // if data was not found in storage or expired,
    // the corresponding sync method will be invoked and return
    // the latest data.
    sync: {
        // we'll talk about the details later.
    }
})

class beaconTesting extends Component {
    constructor(props) {
        super(props);
        // Create our dataSource which will be displayed in the ListView
        var ds = new ListView.DataSource({
                rowHasChanged: (r1, r2) => r1 !== r2
            }
        );
        this.state = {
            // region information,
            // React Native ListView datasource initialization
            dataSource: ds.cloneWithRows([]),
            region: null
        }
        ;
    }

    componentWillMount() {
        //
        // ONLY non component state aware here in componentWillMount
        //
        Beacons.detectIBeacons();

        const uuid = this.state.uuidRef;
        Beacons
            .startRangingBeaconsInRegion(
                'REGION1'
            )
            .then(
                () => {

                    console.log("Ranging started");
                }
            )
            .catch(
                error => console.log(`Beacons ranging not started, error: ${error}`)
            );

        //Monitoring
        // Monitoring
        try {
            Beacons.startMonitoringForRegion('REGION1');
            console.log(`Beacons monitoring started successfully`)
        } catch (err) {
            console.log(`Beacons monitoring not started, error: ${error}`)
        }


    }

    componentDidMount() {
        //
        // component state aware here - attach events
        //
        // Ranging:
        this._loadInitialState();

        DeviceEventEmitter.addListener(
            'beaconsDidRange',
            (data) => {
                this.setState({
                    dataSource: this.state.dataSource.cloneWithRows(data.beacons)
                });
                //console.log("beaconsDidRange");
            }
        );

        DeviceEventEmitter.addListener('regionDidEnter', (region) => {
            console.log("regionDidEnter", region);
            let message = "Welcome";
            if (this.state.region) {
                message = "Welcome back";
            } else {
                this._onValueChange(region);
            }
            console.log(message);
            this.notification(message);
        })
        DeviceEventEmitter.addListener('regionDidExit', (region) => {
            this.notification("Good bye");
        })
    }

    notification = (title)=> {
        PushNotification.localNotification({


            /* iOS and Android properties */
            title: "Hotel Project", // (optional, for iOS this is only used in apple watch, the title will be the app name on other iOS devices)
            message: title, // (required)
            playSound: false, // (optional) default: true
            soundName: 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
            number: '10', // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
            repeatType: 'day', // (Android only) Repeating interval. Could be one of `week`, `day`, `hour`, `minute, `time`. If specified as time, it should be accompanied by one more parameter 'repeatTime` which should the number of milliseconds between each interval
            actions: '["Yes", "No"]',  // (Android only) See the doc for notification actions to know more
        });
    }
    _loadInitialState = () => {
        console.log("Load Initial State");
        storage.load({
            key: 'beacon'
        }).then(ret => {
            // found data goes to then()
            console.log(ret);
            this.setState({region: ret});
        }).catch(err => {
            // any exception including data not found
            // goes to catch()
            switch (err.name) {
                case 'NotFoundError':
                    // TODO;
                    console.log("Not Found");
                    break;
                case 'ExpiredError':
                    // TODO
                    break;
            }
        });
    };
    _onValueChange = (region) => {
        console.log("change");
        this.setState({region: region});
        storage.save({
            key: 'beacon',  // Note: Do not use underscore("_") in key!
            rawData: region
        });
    };

    componentWillUnMount() {
        this.beaconsDidRange = null;
        this.state.region = null;
    }

    removeCache() {
        console.log("Remove");
        // remove single record
        storage.remove({
            key: 'beacon'
        });
    }

    render() {
        const {dataSource} =  this.state;
        return (
            <View style={styles.container}>
                <Text style={styles.headline}>
                    All beacons in the area
                </Text>
                <ListView
                    dataSource={ dataSource }
                    enableEmptySections={ true }
                    renderRow={(rowData) => this.renderRow(rowData)}
                />
                <Button onPress={this.removeCache}
                        title="Remove Cache"
                        color="#841584"
                />
            </View>
        );
    }

    renderRow(rowData) {
        return (
            <View style={styles.row}>

                <Text style={styles.smallText}>
                    UUID: {rowData.uuid ? rowData.uuid : 'NA'}
                </Text>
                <Text style={styles.smallText}>
                    Major: {rowData.major ? rowData.major : 'NA'}
                </Text>
                <Text style={styles.smallText}>
                    Minor: {rowData.minor ? rowData.minor : 'NA'}
                </Text>
                <Text>
                    RSSI: {rowData.rssi ? rowData.rssi : 'NA'}
                </Text>
                <Text>
                    Proximity: {rowData.proximity ? rowData.proximity : 'NA'}
                </Text>
                <Text>
                    Distance: {rowData.accuracy ? rowData.accuracy.toFixed(2) : 'NA'}m
                </Text>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF'
    },
    btleConnectionStatus: {
        // fontSize: 20,
        paddingTop: 20
    },
    headline: {
        fontSize: 20,
        paddingTop: 20
    },
    row: {
        padding: 8,
        paddingBottom: 16
    },
    smallText: {
        fontSize: 11
    }
});

AppRegistry
    .registerComponent(
        'beaconTesting'
        ,
        () =>
            beaconTesting
    )
;
