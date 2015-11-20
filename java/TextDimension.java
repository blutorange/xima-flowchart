package de.xima.demo;

import java.awt.Font;
import java.awt.FontFormatException;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.IOException;

public class TextDimension {

	public static void main(String[] args) throws FontFormatException, IOException {
    BufferedImage img = new BufferedImage(1, 1, 2);
		Graphics2D g2d = img.createGraphics();

    
    Font font = new Font("Arial", Font.PLAIN, 20);
    g2d.setFont(font);
    FontMetrics fm = g2d.getFontMetrics(font);
    System.out.println(fm.stringWidth("Hallo"));
    System.out.println(fm.charWidth("Hallo".charAt(0)));
	}
}
