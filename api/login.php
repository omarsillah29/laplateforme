<?php

function getDatabase() {
    $db_file = '../data/database.json';
    if (!file_exists($db_file)) {
        return null;
    }
    $json_data = file_get_contents($db_file);
    return json_decode($json_data, true);
}

function handleLogin() {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        return;
    }

    $db = getDatabase();
    if ($db === null) {
        http_response_code(500);
        echo json_encode(['error' => 'Database not found']);
        return;
    }

    $email = $data['email'];
    $password = $data['password']; // This is the hashed password from the client

    foreach ($db['users'] as $user) {
        if ($user['email'] === $email && $user['password'] === $password) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'user' => [
                    'email' => $user['email'],
                    'role' => $user['role']
                ]
            ]);
            return;
        }
    }

    http_response_code(401);
    echo json_encode(['error' => 'Email ou mot de passe incorrect.']);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    handleLogin();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}

?>
