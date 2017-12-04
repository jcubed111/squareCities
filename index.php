<!DOCTYPE html>
<html>
<head>
    <link href="https://fonts.googleapis.com/css?family=Lato:100" rel="stylesheet" />
    <style>
        html{
            background: rgba(113, 211, 244, 1.0);
            background-image: linear-gradient(to bottom, rgb(113, 211, 244), #baeeff);
            height: 100%;
        }

        body{
            padding: 0;
            margin: 0;
            overflow: hidden;
            background: rgba(113, 211, 244, 1.0);
            background-image: linear-gradient(180deg, rgb(113, 211, 244), #baeeff);
            height: 100%;
        }

        canvas{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: transparent;
            z-index: 5;
        }

        h1{
            position: absolute;
            left: 0;
            top: 0;
            font-size: 100px;
            color: #a2e5fc;
            font-family: Lato, serif;
            margin: 50px 83px;
            z-index: 0;
        }

        small{
            font-size: 34px;
            position: relative;
            top: -45px;
            left: 6px;
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
    <h1>
        Square Cities<br/>
        <small>John Stimac</small>
    </h1>
    <script src="globals.js"></script>
    <script src="setup.js"></script>
    <script src="vert.js"></script>
    <script src="objectParser.js"></script>
    <script src="world.js"></script>
    <script src="render.js"></script>
    <script>
        setup();
        step();
        // world.generate();
    </script>
</body>
</html>
