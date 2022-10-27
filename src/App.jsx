import { Canvas } from "@react-three/fiber";
import styled from "@emotion/styled";

import Layout from "./Layout";

function App() {
  return (
    <App.Styled>
      <Canvas shadows>
        <Layout>
          <mesh castShadow>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </Layout>
      </Canvas>
    </App.Styled>
  );
}
App.Styled = styled.div`
  position: fixed;
  inset: 0;
`;

export default App;
