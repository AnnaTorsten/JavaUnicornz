<!-- 
queue()
    .defer(d3.xml, "tbana.svg", "image/svg+xml")
    .await(ready);

function ready(error, xml) {
    //Adding our svg file to HTML document
    var importedNode = document.importNode(xml.documentElement, true);
    d3.select("#tbana").node().appendChild(importedNode);
    var svg = d3.select("tbana");
    var svgElem = svg.node();

    // layers
    var stationLayer = svg.append('g');
    var trainLayer = svg.append('g');

    function getStations(path, segmentBlacklist) {
        var segments = path.pathSegList;
        var stations = [];
        var firstStationSegment = segments[0];
        
        var x = firstStationSegment.x,
            y = firstStationSegment.y;
        stations.push({ x: x, y: y });

        for (var seg = 0; seg < segments.length; seg++) {
            if (seg == 0) continue;

            var stationSegment = segments[seg];
            x += stationSegment.x;
            y += stationSegment.y;

            if (segmentBlacklist.indexOf(seg) > -1)
                continue;

            stations.push({ x: x, y: y });
        }

        return stations;
    }

    function getStationLenghts(path, segmentBlacklist) {
        var lengthScale = d3.interpolate(0, path.getTotalLength());

        var lastSeg = 0;
        var segChanges = [0];
        var step = 0.001;
        for (var i = step; i < 1; i += step) {
            var lineLenght = lengthScale(i);
            var seg = path.getPathSegAtLength(lineLenght) - 1;

            if (segmentBlacklist.indexOf(seg) > -1)
                continue;

            if (seg != lastSeg) {
                segChanges.push(i);
                lastSeg = seg;
            }
        }
        segChanges.push(1);

        return segChanges;
    }

    function placeStations(path, segmentBlacklist) {
        segmentBlacklist = segmentBlacklist || [];

        var id = path.id;
        var stations = getStations(path, segmentBlacklist);
        var segChanges = getStationLenghts(path, segmentBlacklist);

        var RADIUS = 2;

        var totalLength = path.getTotalLength();
        var lengthScale = d3.interpolate(0, totalLength);
        var pointScale = d3.scale.linear()
            .interpolate(function() {
                return function(t) {
                    return path.getPointAtLength(lengthScale(t));
                }
            });
        var pointX = function(d) { return pointScale(d).x; };
        var pointY = function(d) { return pointScale(d).y; };

        // colour på pathsen
        var color = d3.select(path)
            .attr('stroke-width', 1)
            .attr('stroke');

        // stationLayer.selectAll('circle')
        //     .data(segChanges)
        //     .enter()
        //         .append('circle')
        //         .style('fill', 'red')
        //         .attr({
        //             'cx': pointX,
        //             'cy': pointY,
        //             'r': RADIUS
        //         });

        function firstOrLast(i, len) {
            return i == 0 || i == (len - 1);
        }

        stationLayer.selectAll('circle.st.train-' + id)
            .data(stations)
            .enter()
                .append('circle')
                .classed('st', true)
                .classed('train-' + id, true)
                .attr({
                    'stroke-width': '1.5',
                    'stroke': function(d, i) { return firstOrLast(i, stations.length) ? color : 'white'; },
                    'fill': function(d, i) { return firstOrLast(i, stations.length) ? 'white' : 'silver'; },
                    'cx': function(d) { return d.x; },
                    'cy': function(d) { return d.y; },
                    'r': function(d, i) { return firstOrLast(i, stations.length) ? 6 : RADIUS; }
                });

        // trains
        for (var n = 0; n < 1; n++) {
            var trainPath = trainLayer.append('path')
                .classed('train-' + id, true)
                .attr('d', d3.select(path).attr('d'))
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 5);

            trans(trainPath.node());
        }
    }
    
    function trans(path, dir, delay) {
        delay = delay || 0;
        d3.select(path).transition()
            .duration(5000)
            .delay(delay)
            .ease('linear')
            .attrTween('stroke-dasharray', tweenDash(path, dir))
            .each('end', function() { trans(path, !dir, 500+Math.floor(Math.random() * 1000)) });
    }

    // 0,     0, s, (l-s)
    // 0, (l-s), s,     0

    function tweenDash(path, dir) {
        var l = path.getTotalLength(),
            s = 8,
            d = 2*s+1,
            i = d3.interpolate(dir ? 0:l-d, dir ? l-d:0);
        return function() {
            return function(t) {
                return '0,' + i(t) + ',' + s + ',1,' + s + ',' + i(1-t);
            };
        };
    }

    placeStations(svgElem.getElementById('blue-akalla'), [4,5]);
    placeStations(svgElem.getElementById('blue-hjulsta'));
    placeStations(svgElem.getElementById('blue-kungs'));

    placeStations(svgElem.getElementById('green-hasselby'));
    placeStations(svgElem.getElementById('green-hagsatra'));
    placeStations(svgElem.getElementById('green-gullmars'));
    placeStations(svgElem.getElementById('green-farsta'), [7]);
    placeStations(svgElem.getElementById('green-skarpnack'));
    placeStations(svgElem.getElementById('red-morby'));
    placeStations(svgElem.getElementById('red-ropsten'), [1,4]);
    placeStations(svgElem.getElementById('red-liljeholmen'), [1,3]);
    placeStations(svgElem.getElementById('red-fruangen'));
    placeStations(svgElem.getElementById('red-norsborg'), [9]);
}
-->