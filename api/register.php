<?php

function getDatabase() {
    $db_file = '../data/database.json';
    if (!file_exists($db_file)) {
        return null;
    }
    $json_data = file_get_contents($db_file);
    return json_decode($json_data, true);
}

function saveDatabase($data) {
    $db_file = '../data/database.json';
    $json_data = json_encode($data, JSON_PRETTY_PRINT);
    file_put_contents($db_file, $json_data);
}

function handleRegister() {
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
    $password = $data['password'];

    // Basic validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !str_ends_with($email, '@laplateforme.io')) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email domain']);
        return;
    }

    foreach ($db['users'] as $user) {
        if ($user['email'] === $email) {
            http_response_code(409);
            echo json_encode(['error' => 'User already exists']);
            return;
        }
    }

    $newUser = [
        'email' => $email,
        'password' => $password, // Password is now hashed client-side
        'role' => 'user'
    ];

    $db['users'][] = $newUser;
    saveDatabase($db);

    http_response_code(201);
    echo json_encode(['success' => 'User registered successfully']);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    handleRegister();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}

?>
