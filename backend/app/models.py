from .database import Base
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime

# Initial models will be defined here
# Example:
# class Repuesto(Base):
#     __tablename__ = "repuestos"
#     id = Column(Integer, primary_key=True, index=True)
#     nombre = Column(String)
#     ...
