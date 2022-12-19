package main

import (
	"flag"
	"fmt"
	"strconv"
	"strings"

	"github.com/fogleman/gg"
)

var (
	dimensions = flag.String("d", "512x512", "Dimensions of the image")
	pointSize  = flag.Float64("p", 80, "Point size of the text")
)

func parseDimensions(s string) (int, int) {
	arr := strings.Split(s, "x")
	if len(arr) == 2 {
		x, err := strconv.Atoi(arr[0])
		if err != nil {
			return 512, 512
		}
		y, err := strconv.Atoi(arr[1])
		if err != nil {
			return 512, 512
		}
		return x, y
	}
	return 512, 512
}

func main() {
	flag.Parse()
	width, height := parseDimensions(*dimensions)

	ctx := gg.NewContext(width, height)
	// #8395F7
	ctx.SetRGB255(0x83, 0x95, 0xF7)
	ctx.Clear()

	// #1C315E
	ctx.SetRGB255(0x1C, 0x31, 0x5E)
	const text = "0x8395F7"
	ctx.LoadFontFace("./fonts/IBMPlexMono-Light.ttf", *pointSize)
	sx, sy := ctx.MeasureString(text)
	ctx.DrawString(text, float64(width)/2-sx/2, float64(height)/2+sy/2)
	ctx.Stroke()

	err := ctx.SavePNG(fmt.Sprintf("0x8395f7_%dx%d.png", width, height))
	if err != nil {
		panic(err)
	}
}
