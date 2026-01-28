use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type")]
pub enum PetState {
    Idle,
    Walking { direction: Direction },
    Sleeping,
    Eating,
    Playing,
    Dragged,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Direction {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetData {
    pub state: PetState,
    pub position: (i32, i32),
    pub hunger: f32,
    pub energy: f32,
    pub happiness: f32,
}

impl Default for PetData {
    fn default() -> Self {
        Self {
            state: PetState::Idle,
            position: (500, 500),
            hunger: 0.3,
            energy: 0.8,
            happiness: 0.7,
        }
    }
}
