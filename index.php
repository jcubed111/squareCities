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
            font-family: Lato, sans-serif;
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
            margin: 50px 83px;
            z-index: 0;
        }

        small{
            font-size: 34px;
            position: relative;
            top: -45px;
            left: 6px;
        }

        #instructions{
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200px;
            margin-left: -100px;
            margin-top: -15px;
            text-align: center;
            font-size: 25px;
            color: rgba(255, 255, 255, 0.6);
            z-index: 10;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.3s;
        }

        #instructions.hidden{
            opacity: 0;
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
        <small>&nbsp;John Stimac</small><br/>
    </h1>
    <div id="instructions">Click to begin</div>
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
