<?php
$courses = [
    ["title" => "Intermediate", "description" => "Basic courses for beginners!"],
    ["title" => "Degree", "description" => "Efficient and accurate degree courses."],
    ["title" => "Post Graduate", "description" => "High-level courses for graduates!"]
];

echo '<div class="grid">';
foreach ($courses as $course) {
    echo "<div class='course-card'>
            <h3>{$course['title']}</h3>
            <p>{$course['description']}</p>
          </div>";
}
echo '</div>';
?>
