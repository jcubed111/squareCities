<!DOCTYPE html>
<html>
<head>
    <style>
        body{
            padding: 0;
            margin: 0;
            overflow: hidden;
        }

        canvas{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }
    </style>

    <script>
        var objectFiles = {
<?php
    foreach(glob("objectFiles/*.obj") as $filename) {
        echo "'".basename($filename, ".obj")."'";
        echo ": `\n";
        echo file_get_contents($filename);
        echo "`,\n";
    }
?>
    };
    </script>
</head>
<body>
    <canvas id="view"></canvas>
    <script src="globals.js"></script>
    <script src="setup.js"></script>
    <script src="vert.js"></script>
    <script src="objectParser.js"></script>
    <script src="world.js"></script>
    <script src="render.js"></script>
    <script>
        setup();
        step();
        world.generate();
    </script>
</body>
</html>
