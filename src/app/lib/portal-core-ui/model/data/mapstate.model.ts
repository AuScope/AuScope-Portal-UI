import { Cartesian3, SceneMode } from 'cesium';

// Used to store the position and orientation of the camera
export class MapState {
    camera: {
        position: Cartesian3,
        direction: Cartesian3,
        up: Cartesian3
    };
    scene: {
        mode: SceneMode // 3D Globe, 2D flat, 2D Columbus
    };
}
